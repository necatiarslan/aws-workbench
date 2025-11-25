# Hierarchical Resource Organization Implementation Plan

## Overview
Transform the S3-only tree view into a hierarchical resource organizer that supports multiple AWS resource types and folders.

## Changes Required

### 1. Tree Structure Updates ✅ DONE
- [x] Add new TreeItemType enum values (Folder, Lambda, CloudWatch, SNS, DynamoDB, SQS, StepFunction, IAM)
- [x] Add FolderPath property to S3TreeItem
- [x] Update refreshUI() to display appropriate icons for all types
- [x] Update setContextValue() to handle Folder type
- [x] Create RESOURCE_TYPE_OPTIONS array for quick pick

### 2. S3TreeView Methods - TO IMPLEMENT

#### AddResource() - New Method
Replace current AddBucket() with AddResource():
1. Show quick pick with resource type options
2. Based on selection, call appropriate handler:
   - Folder → AddFolder()
   - S3 Bucket → AddS3Bucket() (existing logic)
   - Lambda → AddLambdaFunction()
   - etc.

#### Folder Operations
- **AddFolder(parentNode?: S3TreeItem)**
  - Prompt for folder name
  - Create folder node
  - Add to parent or root
  - Save state

- **AddSubFolder(parentFolder: S3TreeItem)**
  - Similar to AddFolder but with parent set
  
- **RenameFolder(folder: S3TreeItem)**
  - Prompt for new name
  - Update folder path for all children recursively
  - Save state

- **RemoveFolder(folder: S3TreeItem)**
  - Confirm deletion
  - Remove folder and all children
  - Save state

#### Resource Addition Methods (Stubs for now)
- **AddS3Bucket(parentFolder?: S3TreeItem)** - Move existing AddBucket logic
- **AddLambdaFunction(parentFolder?: S3TreeItem)**
- **AddCloudWatchLogGroup(parentFolder?: S3TreeItem)**
- **AddSNSTopic(parentFolder?: S3TreeItem)**
- **AddDynamoDBTable(parentFolder?: S3TreeItem)**
- **AddSQSQueue(parentFolder?: S3TreeItem)**
- **AddStepFunction(parentFolder?: S3TreeItem)**
- **AddIAMRole(parentFolder?: S3TreeItem)**

### 3. Context Menu Updates

Update package.json commands and menus:
- Change "Add Bucket" to "Add Resource"
- Add "Add Subfolder" for Folder context
- Add "Rename Folder" for Folder context
- Add "Delete Folder" for Folder context
- Add "Add Resource Here" for Folder context

### 4. Command Registration

Update extension.ts to register new commands:
- S3TreeView.AddResource (renamed from AddBucket)
- S3TreeView.AddSubfolder
- S3TreeView.RenameFolder
- S3TreeView.RemoveFolder
- S3TreeView.AddResourceToFolder

### 5. State Management

Update SaveState() and LoadState():
- Save folder structure
- Save resource hierarchy
- Maintain backward compatibility

### 6. YAML Configuration

Update YAML format to support hierarchy:
```yaml
root:
  - folder: Development
    children:
      - s3: arn:aws:s3:::dev-bucket
      - lambda: my-function-dev
  - s3: arn:aws:s3:::prod-bucket
```

## Implementation Priority

1. ✅ Tree item type updates (DONE)
2. **Folder operations** (AddFolder, RenameFolder, RemoveFolder) - NEXT
3. **Resource type selection dialog** in AddResource
4. **Context menus and commands**
5. **State persistence**
6. **YAML format update**
7. **Resource-specific implementations** (can be added incrementally)

## Backward Compatibility

- Existing bucket-only configurations will still work
- YAML files without folders will load correctly
- Folders are optional

## Notes

- Start with folder infrastructure first
- Resource type handlers can be stubs initially
- Each resource type can have its own implementation later
- Folder operations are the foundation for everything else
