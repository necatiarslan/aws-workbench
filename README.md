# AWS Workbench

![AWS Workbench Main Screen](media/readme/main-screen.png)

A powerful VS Code extension that brings your AWS resources directly into your editor's sidebar. Explore, manage, and interact with S3, Lambda, Step Functions, CloudWatch Logs, and more—all from one unified tree view.

## Features

### 🌳 Unified Resource Tree View
- Single tree view displaying all your AWS resources across services
- Organize resources by AWS profiles, regions, and services
- Persistent tree state that remembers your configuration between sessions

### 🪣 S3 Management
- Browse S3 buckets and objects
- Create, delete, and download files and folders
- Search and filter objects within buckets
- Direct file viewing and editing in VS Code

### ⚡ Lambda Functions
- List and manage Lambda functions
- View function configuration (environment variables, triggers, tags)
- Invoke functions with custom payloads
- Stream and view function logs in real-time
- Download and update function code

### 🔄 Step Functions
- Browse and manage state machines
- View state machine definitions (JSON/YAML)
- Start executions with validation
- Monitor execution status (running, succeeded, failed, etc.)
- View execution history and logs
- Compare and update definitions

### 📊 CloudWatch Logs
- Explore log groups and streams
- View log events in real-time
- Filter and search logs
- Save frequently accessed log groups

### 📁 Local File Management
- Organize local files and scripts
- Create and manage bash scripts
- Quick access to project notes

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "AWS Workbench"
4. Click Install

## Getting Started

### Prerequisites
- AWS credentials configured locally (via `~/.aws/credentials` or `~/.aws/config`)
- An AWS account with appropriate permissions for the services you want to use

### Configuration

1. **Set AWS Profile**: Click the profile button in the Activity Bar to select your AWS profile
2. **Set Region**: Choose your preferred AWS region
3. **Add Resources**: Use the "+" buttons in the tree view to:
   - Add S3 buckets
   - Add Lambda functions
   - Add Step Functions state machines
   - Add CloudWatch Log Groups

### Authentication
The extension uses AWS SDK's credential chain, which automatically detects credentials from:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS credentials file (`~/.aws/credentials`)
- AWS config file (`~/.aws/config`)
- IAM role (when running in AWS)

## Usage

### Context Menus
Right-click on any resource for options like:
- **Add to Favorites**: Mark frequently used resources
- **Hide**: Temporarily hide resources from view
- **Copy Name/ARN**: Quick copying of resource identifiers
- **Open**: View resource details

### Filtering
- **Text Search**: Filter resources by name
- **Favorites**: Show only favorited resources
- **Hidden**: Toggle visibility of hidden resources
- **Profile/Region**: Filter by AWS profile or region

### Resource-Specific Actions

#### S3
- **Download**: Get files/folders to your local machine
- **Upload**: Push files to buckets
- **Delete**: Remove objects safely
- **Search**: Find objects by name or pattern

#### Lambda
- **Run**: Invoke functions with optional JSON payload
- **View Logs**: Stream real-time CloudWatch Logs
- **Edit Config**: Modify environment variables and settings
- **Download Code**: Export function code

#### Step Functions
- **Execute**: Start state machine executions
- **View Definition**: Inspect state machine JSON
- **Update Definition**: Modify and deploy new versions
- **Monitor**: Track execution status and history
- **View Logs**: Access execution logs

#### CloudWatch Logs
- **View Events**: Stream log entries
- **Search**: Filter by keywords
- **Export**: Save logs to files

## Advanced Features

### Tree State Persistence
- Your tree configuration (expanded nodes, selections) is automatically saved
- Restore your view exactly as you left it

### Keyboard Shortcuts
- `Ctrl+Shift+X` / `Cmd+Shift+X`: Open Extensions
- Right-click for context menus
- Enter/Return: Expand/collapse nodes

### Export/Import
- Export your entire resource tree as JSON
- Import configurations to quickly restore or share setups

### Telemetry
Anonymous usage telemetry helps improve the extension (can be disabled in VS Code settings)

## Troubleshooting

### Unable to Connect to AWS
- Verify AWS credentials are configured: `aws sts get-caller-identity`
- Check that your credentials have appropriate permissions
- Ensure the correct profile is selected in the extension

### Slow Performance
- Large S3 buckets may take time to load initially
- Use text filters to narrow results
- Consider splitting large buckets across multiple sessions

### Missing Resources
- Verify your IAM role has permissions for the services you're accessing
- Check that you've selected the correct AWS profile and region
- Some resources may be hidden—use the visibility filter to show all

## Development

### Building from Source
```bash
npm install
npm run compile        # Single compilation
npm run watch         # Live rebuild on file changes
npm run lint          # Run linter
npm test              # Run test suite
npm run vscode:prepublish  # Prepare for publication
```

### Architecture
The extension follows a modular architecture:
- **Tree View**: Central UI component managing the resource tree
- **Services**: Domain-specific services (S3Service, LambdaService, etc.)
- **API Wrappers**: AWS SDK abstractions with caching and error handling
- **Node System**: Extensible node base class for tree items
- **Persistence**: Automatic state saving and restoration

### Contributing
We welcome contributions! Please ensure:
- Code follows the existing style (use `npm run lint`)
- Tests pass (`npm test`)
- Tree state is properly managed via `TreeState.save`
- New nodes extend `NodeBase` and use event emitters

## Known Limitations

- Very large S3 buckets (100k+ objects) may have performance impact
- Real-time sync requires manual refresh in some cases
- Some advanced AWS features are not yet supported

## License

AWS Workbench is licensed under the [MIT License](LICENSE). See the [LICENSE](LICENSE) file for details.

## Support

- Report issues on [GitHub](https://github.com/necatiarslan/aws-workbench/issues)
- Check [CHANGELOG.md](CHANGELOG.md) for version history
- Review the [AWS SDK documentation](https://docs.aws.amazon.com/sdk-for-javascript/) for AWS-specific questions

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.