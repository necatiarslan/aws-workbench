# Hierarchical YAML Configuration Support

## Overview
The extension now supports a hierarchical YAML configuration format that allows organizing resources into folders. This replaces the previous flat list structure, though backward compatibility is maintained.

## New YAML Format

The `aws-workbench.yaml` file now supports nested folders and resources:

```yaml
root:
  # Root level bucket
  - s3: arn:aws:s3:::my-bucket
    shortcuts:
      - foto 1.JPG
      - README.md

  # Root level folder
  - folder: Development
    resources:
      # Nested folder
      - folder: Backend
        resources:
          - s3: arn:aws:s3:::dev-backend-logs
      
      # Nested bucket
      - s3: arn:aws:s3:::dev-assets
```

## Key Features

### 1. Recursive Folder Structure
- Folders can contain other folders and resources.
- Depth is unlimited.
- Structure is preserved exactly as seen in the Tree View.

### 2. Resource Types
- **s3**: Represents an S3 bucket. Supports `shortcuts` list.
- **folder**: Represents a container for other resources. Supports `resources` list.

### 3. Backward Compatibility
- The extension can still load legacy configuration files with flat `BucketList` and `ShortcutList`.
- When exporting, the new hierarchical format is used automatically.

## How to Use

1. **Organize your resources** in the Tree View (create folders, move buckets).
2. **Export Configuration**:
   - Run command `AWS Workbench: Export Config to YAML`
   - Or click the export button in the view title.
3. **Save**: Choose to save in Workspace Root or `.vscode` folder.

The generated YAML file will reflect your current folder structure.
