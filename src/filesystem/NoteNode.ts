import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class NoteNode extends NodeBase {

    @Serialize()
    public NoteTitle: string = "";

    @Serialize()
    public NoteContent: string = "";

    constructor(NoteTitle: string, parent?: NodeBase) 
    {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;

        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();

        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
    }

    private async handleNodeAdd(): Promise<void> {
        const result:string[] = [];
        result.push("Folder");
        result.push("Note");
        result.push("File");
        result.push("S3 Bucket");
        result.push("CloudWatch Log Group");
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
            case "S3 Bucket":
                await ServiceHub.Current.FileSystemService.Add(this, "S3 Bucket");
                break;
            case "CloudWatch Log Group":
                await ServiceHub.Current.FileSystemService.Add(this, "CloudWatch Log Group");
                break;
        }
        TreeState.save();
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private handleNodeView(): void {
        vscode.window.showInformationMessage(`${this.NoteTitle}`, { modal: true, detail: this.NoteContent });
    }

    private async handleNodeEdit(): Promise<void> {
        let noteContent = await vscode.window.showInputBox({ placeHolder: 'Note Content', value: this.NoteContent });
        if(!noteContent){ return; }
        this.NoteContent = noteContent;
        TreeState.save();   
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('NoteNode', NoteNode);