# AWS Workbench

![AWS Workbench Main Screen](media/readme/main-screen.png)

A powerful VS Code extension that brings your AWS resources directly into your editor's sidebar. Explore, manage, and interact with S3, Lambda, Step Functions, DynamoDB, Glue, SQS, SNS, IAM, CloudWatch Logs, and more—all from one unified tree view.

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

### 🗄️ DynamoDB
- Browse tables and indexes
- View table keys, capacity, and configuration
- Query and scan tables with filters
- Add, edit, and delete items
- Batch operations support
- View and manage tags

### 🔧 AWS Glue
- Manage Glue ETL jobs
- View and download job code
- Compare and update job scripts
- Trigger jobs with custom parameters
- Monitor job runs and status
- View job run logs and history
- Generate job run reports

### 📬 SQS (Simple Queue Service)
- Browse and manage queues
- Send messages (ad-hoc or from file)
- Receive and view messages
- View queue details and policies
- Dead-letter queue support
- Purge queues

### 📢 SNS (Simple Notification Service)
- Manage topics and subscriptions
- Publish messages (ad-hoc or from file)
- View subscription details
- Create and delete subscriptions

### 🔐 IAM (Identity and Access Management)
- Browse IAM roles and policies
- View role trust relationships
- Inspect policy documents and versions
- View policy attachments
- Manage role inline policies
- View and manage tags

### 📊 CloudWatch Logs
- Explore log groups and streams
- View log events in real-time
- Filter and search logs
- Save frequently accessed log groups

### 📁 Local File Management
- Organize local files and scripts
- Create and manage bash scripts
- Quick access to project notes

### Telemetry
Anonymous usage telemetry helps improve the extension (can be disabled in VS Code settings)

## Contributing
### Coming Soon
- Bucket with a default key prefix: set a default key prefix when adding a bucket to the tree view to open the bucket with the specified prefix
- add notes to resources: add notes subnode to aws resources to add custom notes

- colorful resource icons
- Telemetry logging

## Support

- Report issues on [GitHub](https://github.com/necatiarslan/aws-workbench/issues)
- Check [CHANGELOG.md](CHANGELOG.md) for version history

## Donate
If you find this extension helpful, consider supporting its development through a donation. Your contributions help maintain and improve the extension.
Click [here](https://github.com/sponsors/necatiarslan) to donate. Thank you for your support!