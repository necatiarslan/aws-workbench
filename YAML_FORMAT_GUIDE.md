# AWS Workbench YAML Configuration Format

## Structure

The configuration file uses a hierarchical structure where each bucket entry can have its own list of shortcuts nested underneath.

```yaml
root:
  - s3: <bucket-arn-or-name>
    shortcuts:
      - <path1>
      - <path2>
  - s3: <another-bucket>
    shortcuts:
      - <path3>
```

## Format Details

### Root Element
- **Required**: `root` - Array of bucket entries

### Bucket Entry
Each entry in the `root` array has:
- **Required**: `s3` - S3 bucket identifier (ARN or plain name)
- **Optional**: `shortcuts` - Array of shortcut paths

### S3 Bucket Identifier
Can be specified in two formats:
1. **ARN format**: `arn:aws:s3:::bucket-name`
2. **Plain name**: `bucket-name`

Both formats are supported and converted internally by the extension.

### Shortcuts
- Array of strings representing S3 object keys (file or folder paths)
- Folder paths typically end with `/`
- Can be files: `README.md`, `config/settings.json`
- Can be folders: `logs/`, `data/2024/`
- Optional field - buckets can exist without shortcuts

## Examples

### Minimal Configuration
```yaml
root:
  - s3: my-bucket
```

### Bucket with File Shortcuts
```yaml
root:
  - s3: arn:aws:s3:::my-bucket
    shortcuts:
      - README.md
      - package.json
      - tsconfig.json
```

### Bucket with Folder Shortcuts
```yaml
root:
  - s3: data-bucket
    shortcuts:
      - logs/production/
      - logs/staging/
      - backups/
```

### Multiple Buckets
```yaml
root:
  - s3: arn:aws:s3:::bucket-one
    shortcuts:
      - important-file.txt
      - config/
  
  - s3: bucket-two
    shortcuts:
      - data/
  
  - s3: bucket-three
    # No shortcuts for this bucket
```

### Mixed File and Folder Shortcuts
```yaml
root:
  - s3: arn:aws:s3:::documents
    shortcuts:
      - templates/invoice.pdf
      - contracts/2024/
      - reports/
      - important-memo.docx
```

## Best Practices

1. **Use ARN format** for clarity and consistency
2. **End folder paths with `/`** to distinguish from files
3. **Group related shortcuts** under the same bucket
4. **Add comments** to document your configuration
5. **Keep in version control** to share with your team
6. **Use meaningful paths** that represent frequently accessed locations

## File Locations

The extension looks for configuration files in two locations (in priority order):

1. **`.vscode/aws-workbench.yaml`** (workspace-specific, checked first)
   - Best for personal or workspace-specific configurations
   - Often added to `.gitignore`
   - Takes priority if both files exist

2. **`aws-workbench.yaml`** (workspace root)
   - Best for shared team configurations
   - Usually committed to version control
   - Fallback if `.vscode/aws-workbench.yaml` doesn't exist

### When to Use Each Location

#### Use `.vscode/aws-workbench.yaml` when:
- Configuration is personal/workspace-specific
- Different team members need different shortcuts
- Working on multiple environments (dev, staging, prod)
- Testing temporary bucket configurations

#### Use `aws-workbench.yaml` (root) when:
- Configuration should be shared with the entire team
- Standard bucket setup for all developers
- Project-specific buckets that everyone needs
- Want configuration in version control

## Loading Priority

When the extension starts:
1. **First**: Checks for `.vscode/aws-workbench.yaml`
2. **Then**: Checks for `aws-workbench.yaml` in workspace root
3. **If found**: Loads buckets and shortcuts from YAML
4. **If not found**: Falls back to VSCode global state (previous behavior)

## Exporting

To create a YAML file from your current configuration:
1. Open the AWS Workbench view
2. Click the menu (⋮) in the view title
3. Select "Export Config to YAML"
4. Choose save location:
   - **Workspace Root**: For shared team configuration
   - **.vscode Folder**: For personal/workspace-specific configuration

The exported file will:
- Convert all bucket names to ARN format
- Group shortcuts by their bucket
- Maintain the hierarchical structure
- Be ready for version control (if saved to workspace root)


## Notes

- The extension reads this file on startup/reload
- Changes to the YAML file require reloading the extension or restarting VS Code
- Invalid YAML will show an error message
- Missing buckets or invalid paths will be logged to the output channel
