import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class FolderNode extends NodeBase {

    @Serialize()
    public FolderName: string = "";

    constructor(FolderName: string, parent?: NodeBase) 
    {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;

        this.EnableNodeAlias = true;
        this.SetContextValue();

        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
    }

    private async handleNodeAdd(): Promise<void> {
        const result:string[] = [];
        result.push("Folder");
        result.push("Note");
        result.push("File");
        result.push("Bash Script");
        result.push("Bash File");
        result.push("S3 Bucket");
        result.push("CloudWatch Log Group");
        result.push("Lambda Function");
        let nodeType = await vscode.window.showQuickPick(result, {canPickMany:false, placeHolder: 'Select Item Type'});

        if(!nodeType){ return; }

        switch (nodeType) {
            case "Folder":
                await ServiceHub.Current.FileSystemService.Add(this, "Folder");
                break;
            case "Note":
                await ServiceHub.Current.FileSystemService.Add(this, "Note");
                break;
            case "File":
                await ServiceHub.Current.FileSystemService.Add(this, "File");
                break;
            case "Bash Script":
                await ServiceHub.Current.FileSystemService.Add(this, "Bash Script");
                break;
            case "Bash File":
                await ServiceHub.Current.FileSystemService.Add(this, "Bash File");
                break;
            case "S3 Bucket":
                await ServiceHub.Current.S3Service.Add(this);
                break;
            case "CloudWatch Log Group":
                await ServiceHub.Current.CloudWatchLogService.Add(this);
                break;
            case "Lambda Function":
                await ServiceHub.Current.LambdaService.Add(this);
                break;
        }
        TreeState.save();
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('FolderNode', FolderNode);