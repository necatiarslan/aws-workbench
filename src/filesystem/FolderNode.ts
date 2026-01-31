import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { TreeState } from '../tree/TreeState';
import { TreeView } from '../tree/TreeView';

export class FolderNode extends NodeBase {

    @Serialize()
    public FolderName: string = "";

    constructor(FolderName: string, parent?: NodeBase) 
    {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;

        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());

        this.SetContextValue();
    }

    private async handleNodeAdd(): Promise<void> {
        TreeView.Current.Add(this);
     }

    private async handleNodeEdit(): Promise<void> {
        const newName = await vscode.window.showInputBox({
            value: this.FolderName,
            placeHolder: 'Folder Name'
        });
        if(!newName){ return; }

        this.FolderName = newName;
        this.label = newName;
        this.RefreshTree()
        this.TreeSave();
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('FolderNode', FolderNode);