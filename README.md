# AWS S3 Extension for Visual Studio Code

![Main Screen](media/psc-main-screen.png)

The **AWS S3** extension brings the power of Amazon S3 directly into VS Code. Browse, manage, and manipulate buckets, files, and folders without ever leaving your editor.

---

## 📋 Table of Contents
- [Features](#features)
- [Why Use It?](#why-use-it)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Explorer Overview](#explorer-overview)
- [Search Functionality](#search-functionality)
- [Buckets & Shortcuts](#buckets--shortcuts)
- [YAML Configuration](#yaml-configuration)
- [File & Folder Views](#file--folder-views)
- [Edit & Copy Menus](#edit--copy-menus)
- [Endpoint & Credentials](#endpoint--credentials)
- [Bug Reporting & Contributions](#bug-reporting--contributions)
- [Roadmap](#roadmap)
- [Sponsor & Survey](#sponsor--survey)
- [Contact](#contact)

---

## 🚀 Features
- **File Management** – Rename, copy, move, delete, upload, download.
- **Folder Management** – Create, rename, copy, move, delete, download.
- **Copy Options** – File name (with/without extension), key, ARN, URL, S3 URI.
- **Shortcuts** – Pin frequently used files/folders for instant access.
- **Advanced Search** – Search across buckets by name, extension, or key (case‑insensitive).
- **YAML Configuration** – Manage buckets and shortcuts via `aws-workbench.yaml` file with ARN support.
- **Endpoint & Region Customisation** – Works with custom S3‑compatible endpoints (e.g., LocalStack).
- **Localstack Support** – Seamlessly test against a local S3 emulator.

---

## 🌟 Why Use It?
Whether you’re a developer, data scientist, or sysadmin, this extension streamlines your workflow with an intuitive UI that makes S3 resource management faster and more convenient.

---

## 📦 Installation
1. Open VS Code.
2. Go to **Extensions** (`Ctrl+Shift+X`).
3. Search for **AWS S3** and click **Install**.
4. Reload VS Code if prompted.

---

## 🛠️ Getting Started
1. Open the **AWS S3 Explorer** view from the Activity Bar.
2. Add a bucket using the `+` button (you can filter by name or list all buckets).
3. Browse files/folders, use the context menu for actions, or click the **Search** button for advanced queries.

---

## 📂 Explorer Overview
![Explorer](media/psc-explorer.png)

The Explorer lists all objects in the selected bucket. Use the toolbar to refresh, upload, create folders, or navigate.

---

## 🔎 Search Functionality
![Search](media/psc-search.png)

Search is case‑insensitive and supports:
- File name
- Extension
- Full key path

Results are displayed in the **Search** view; clicking a result opens it in the Explorer.

---

## 📁 Buckets & Shortcuts
![Buckets & Shortcuts](media/psc-treeview.png)

- Add buckets via the `+` button.
- Create shortcuts for quick access to frequently used objects.

---

## ⚙️ YAML Configuration

You can manage your buckets and shortcuts using a `aws-workbench.yaml` configuration file. The extension looks for this file in two locations:

1. **`.vscode/aws-workbench.yaml`** (workspace-specific, checked first)
2. **`aws-workbench.yaml`** (workspace root)

### Creating a Configuration File

Create a file named `aws-workbench.yaml` in either your workspace root or `.vscode` folder with the following structure:

```yaml
# AWS Workbench Configuration File

root:
  # First bucket with shortcuts
  - s3: arn:aws:s3:::my-bucket-name
    shortcuts:
      - README.md
      - tsconfig.json
      - src/index.ts

  # Second bucket with shortcuts  
  - s3: arn:aws:s3:::another-bucket
    shortcuts:
      - data/logs/
      - config/prod/

  # Bucket without shortcuts (plain bucket name also works)
  - s3: my-third-bucket
```

### Configuration Locations

#### Workspace Root (`aws-workbench.yaml`)
- **Best for**: Shared team configurations
- **Version Control**: Usually committed to Git
- **Use case**: Standard bucket/shortcut setup for all team members

#### .vscode Folder (`.vscode/aws-workbench.yaml`)
- **Best for**: Personal/workspace-specific configurations
- **Version Control**: Often in `.gitignore`
- **Use case**: Personal shortcuts or environment-specific buckets
- **Priority**: Checked first if both files exist

### Features

- **Hierarchical Structure**: Each bucket has its shortcuts nested directly underneath
- **Automatic Loading**: The extension automatically loads buckets and shortcuts from YAML when it exists
- **Dual Location Support**: Checks `.vscode/` folder first, then workspace root
- **ARN Support**: Buckets can be specified using either ARN format (`arn:aws:s3:::bucket-name`) or plain bucket names
- **Export Command**: Choose to save in workspace root or `.vscode` folder
- **Version Control**: Keep configuration in version control and share it with your team
- **Fallback**: If no YAML config is found, the extension falls back to VSCode's global state storage

### Exporting Configuration

To export your current configuration:
1. Open the AWS Workbench view
2. Click the menu (⋮) in the view title
3. Select "Export Config to YAML"
4. Choose save location:
   - **Workspace Root**: Visible to all team members (recommended for shared setups)
   - **.vscode Folder**: Workspace-specific (recommended for personal configurations)

---


## 📄 File & Folder Views
### File View
![File View](media/psc-file.png)

### Empty Folder View
![Empty Folder](media/psc-empty-folder.png)

---

## 🔧 Edit & Copy Menus
### Edit Menu
![Edit Menu](media/psc-edit-combo.png)

### Copy Menu
![Copy Menu](media/psc-copy-combo.png)

---

## 🌐 Endpoint & Credentials
### Endpoint URL
You can point the extension at any S3‑compatible service (e.g., LocalStack) by setting the endpoint URL:
```
http://localhost:4566
```
![Endpoint](media/psc-endpoint.png)

### AWS Credentials
The extension follows the standard AWS SDK credential chain:
- **Environment variables** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
- **Shared credentials file** (`~/.aws/credentials` and `~/.aws/config`)
- **EC2 Instance Metadata Service**
- **ECS Container Credentials**
- **AWS SSO**
- **Web Identity Tokens**

For more details, see the [AWS CLI credential docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).

---

## 🐞 Bug Reporting & Contributions
- **Report bugs / request features**: <https://github.com/necatiarslan/aws-workbench/issues/new>
- Contributions are welcome! Fork the repo, make your changes, and submit a pull request.

---

## 🗺️ Roadmap
### Todo
- S3 Select support
- Share active profile with other extensions
- Calculate folder size & object count
- Warning for > 1000 items
- Drag‑and‑drop upload
- Detailed error handling (e.g., `NoSuchBucket`)
- Persist favorite/hidden node states
- Progress bars for move/copy/rename operations
- Keep search text per folder navigation

### Nice‑to‑Have
- VS Code icons for files/folders (removed in current version)
- Auto‑refresh option
- Paging beyond 1000 items
- Sort by name/type
- Display selected file/folder count
- Filter by date/size
- Multiple Explorer instances
- Hover‑highlight icons
- Freeze top bar
- Bucket ACL‑based permission handling
- Local folder sync
- Notes & colour tags for buckets/keys

---

## 🙏 Sponsor & Survey
If you find this extension useful, consider:
- **Sponsoring** me on GitHub: <https://github.com/sponsors/necatiarslan>
- **Taking the survey** to help improve the extension: <https://bit.ly/s3-extension-survey>

---

## 📞 Contact
- **LinkedIn**: <https://www.linkedin.com/in/necati-arslan/>
- **Email**: necatiarslan@gmail.com

---

*Thanks for using the AWS S3 Extension!*