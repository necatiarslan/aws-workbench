import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class NoteNode extends NodeBase {

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
    }

    @Serialize()
    public NoteTitle: string = "";

    @Serialize()
    public NoteContent: string = "";

    public async NodeAdd(): Promise<void> {
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

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        vscode.window.showInformationMessage(`${this.NoteTitle}`, { modal: true, detail: this.NoteContent });

    }

    public async NodeEdit(): Promise<void> {
        let noteContent = await vscode.window.showInputBox({ placeHolder: 'Note Content', value: this.NoteContent });
        if(!noteContent){ return; }
        this.NoteContent = noteContent;
        TreeState.save();   
    }

    public NodeRun(): void {
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('NoteNode', NoteNode);