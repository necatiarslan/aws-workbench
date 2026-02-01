# AWS Workbench Copilot Instructions

## Project Overview
AWS Workbench is a VS Code extension providing unified management of AWS resources (S3, Lambda, DynamoDB, Step Functions, Glue, SQS, SNS, IAM, CloudWatch Logs) through a tree view sidebar. Built with TypeScript/Node.js using the VS Code Extension API.

**Key Architecture**: Unified tree provider → Service layer (per-service) → API clients → AWS SDK v3

---

## Critical Architecture Patterns

### 1. Service Layer Pattern
Each AWS service follows identical structure:
- **ServiceBase** abstract class in [src/tree/ServiceBase.ts](src/tree/ServiceBase.ts) - defines `Add()` interface
- Each service (`LambdaService`, `S3Service`, `DynamoDBService`, etc.) extends `ServiceBase`:
  - Singleton pattern: `public static Current: ServiceName`
  - Instantiated in [src/tree/ServiceHub.ts](src/tree/ServiceHub.ts) during extension activation
  - Implements `async Add()` to handle user resource selection workflows
  - Uses telemetry tracking and `ui.logToOutput()` for debugging

**Example flow**: User clicks "Add" → `ServiceHub.Current.S3Service.Add()` → shows region input → queries AWS → creates S3BucketNode children

### 2. Node Tree Hierarchy
All tree items extend [NodeBase](src/tree/NodeBase.ts) (which extends `vscode.TreeItem`):
- **Root nodes**: Direct children of tree (e.g., `S3BucketNode`, `LambdaFunctionNode`)
- **Parent-child relationships**: Nodes maintain `Parent` and `Children[]` arrays; parent inherits `AwsProfile`, `Workspace`, visibility flags
- **Event emitters**: Each node has `OnNodeAdd`, `OnNodeRemove`, `OnNodeRefresh`, etc. - subscribe in constructor to handle operations
- **@Serialize() decorator**: Only marked properties persist to VS Code `globalState` (see [Serialize.ts](src/common/serialization/Serialize.ts))

**Example node structure**:
```
LambdaFunctionNode (FunctionName)
├─ LambdaInfoGroupNode
├─ LambdaCodeGroupNode
│  ├─ LambdaCodeFileNode
│  ├─ LambdaCodeDownloadNode
│  └─ LambdaCodeUpdateNode
├─ LambdaEnvGroupNode
└─ LambdaLogGroupNode
```

### 3. API Layer Pattern
Each service has `API.ts` containing:
- AWS SDK client factory functions: `GetS3Client()`, `GetLambdaClient()`, etc.
  - All accept `region: string`, fetch credentials from `Session.Current.GetCredentials()`
  - Support custom AWS endpoint via `Session.Current.AwsEndPoint`
- API functions return `MethodResult<T>` (generic wrapper with `result`, `isSuccessful`, `error`)
- Consistent error handling: catch blocks call `ui.showErrorMessage()` AND `ui.logToOutput()`

**Example**: [src/step-functions/API.ts#L25](src/step-functions/API.ts#L25)

### 4. Webview Pattern
Interactive data views (queries, editing, logs) use WebviewPanels:
- Constructor takes `vscode.WebviewPanel` + data params
- Static factory method: `public static async show(...)` creates panel, instantiates view, handles messages
- HTML/CSS/JS in `media/<service>/` folders
- Message passing: `panel.webview.postMessage()` ↔ `panel.webview.onDidReceiveMessage()`

**Examples**: [CloudWatchLogView](src/cloudwatch-logs/CloudWatchLogView.ts), [DynamoDBQueryView](src/dynamodb/DynamoDBQueryView.ts)

---

## State Management & Persistence

### Tree State (Node Structure)
- [TreeState.ts](src/tree/TreeState.ts): Debounced save/load of entire tree to VS Code `globalState`
- Triggered by node changes via `TreeState.save()` (500ms debounce) or `TreeState.saveImmediate()` on deactivation
- Uses [TreeSerializer](src/common/serialization/TreeSerializer.ts) with `@Serialize()` decorator to selectively persist properties
- Deserialization uses `NodeRegistry` to recreate correct node types from JSON

**On Extension Activate** (see [extension.ts](src/extension.ts#L18)):
1. Initialize `Session` (AWS credentials/profile)
2. Initialize `ServiceHub` (all service instances)
3. Create `TreeView` (registers commands, creates tree provider)
4. `TreeState.load()` deserializes saved nodes
5. `TreeView.Current.Refresh()` renders tree

---

## Build, Test & Development

### Build & Watch
```bash
npm run compile      # TypeScript → JavaScript in ./out/
npm run watch        # tsc -watch -p ./
```
VS Code automatically reloads extension on file changes during `npm run watch` in debug mode.

### Debugging
- Press F5 in VS Code to launch extension in debug window
- Set breakpoints, use Debug Console
- Output goes to "Debug Console" tab and `ui.logToOutput()` populates "Aws Workbench" output channel

### Commands Registration
- All commands registered in [TreeView.RegisterCommands()](src/tree/TreeView.ts#L24)
- Commands defined in `package.json` under `contributes.commands`
- Context menu visibility controlled by `viewItem` regex patterns (e.g., `viewItem =~ /#NodeAdd#/`)

---

## Key Conventions & Patterns

### Error Handling
- **Always use `MethodResult<T>`** for API returns (not throw exceptions)
- Display errors: `ui.showErrorMessage("Context", error)` + `ui.logToOutput()`
- Check `result.isSuccessful` before accessing `result.result`

### Telemetry
- Optional anonymous telemetry tracking
- Call `Telemetry.Current?.send("ServiceName.MethodName")` at operation start
- User can disable in VS Code settings

### Node Context Values
- Set via `this.contextValue = "..."` containing `#ActionName#` flags
- Controls which context menu items appear (package.json menus with `viewItem =~ /pattern/`)
- Example: `contextValue = "#NodeAdd##NodeRemove##NodeRefresh#"` enables Add/Remove/Refresh

### Tree Refresh
- Call `this.RefreshTree()` after node state changes
- TreeProvider observes `TreeProvider._onDidChangeTreeData` to re-render affected nodes
- Debounced `TreeState.save()` automatically called

### AWS Credentials & Sessions
- [Session](src/common/Session.ts) singleton manages AWS profile, region, endpoint
- Accessed as `Session.Current.AwsProfile`, `Session.Current.AwsRegion`
- Credentials loaded via `Session.Current.GetCredentials()` from local `~/.aws/credentials`

---

## File Organization Guide

| Directory | Purpose |
|-----------|---------|
| `src/tree/` | Core: TreeView, TreeProvider, NodeBase, ServiceBase, TreeState, ServiceHub |
| `src/common/` | Shared: Session, UI, Telemetry, EventEmitter, MethodResult, serialization |
| `src/<service>/` | Service-specific: API.ts, Service.ts, Node classes (e.g., LambdaFunctionNode) |
| `media/<service>/` | Webview HTML/CSS/JS for interactive views |
| `src/aws-sdk/` | AWS credentials file parsing (AWS SDK helpers) |

---

## Common Tasks

**Adding a new tree node type**: Extend `NodeBase`, mark properties with `@Serialize()`, override `LoadDefaultChildren()`, attach event handlers in constructor.

**Integrating new AWS service**: Create service folder, implement `API.ts` (AWS SDK calls returning `MethodResult`), create `Service.ts` extending `ServiceBase`, add to `ServiceHub`, create node classes, register in `NodeRegistry`.

**Creating interactive view**: Extend webview pattern from DynamoDBQueryView/CloudWatchLogView - create TypeScript class with static `show()` factory, message handlers, and corresponding HTML in `media/`.

**Adding command**: Register in `TreeView.RegisterCommands()`, define in `package.json`, implement handler logic, set appropriate node `contextValue` flags.
