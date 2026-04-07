import { Serialize } from '../common/serialization';
import { NodeBase } from '../tree/NodeBase';
import * as ui from '../common/UI'
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';

export class FileNode extends NodeBase {


    @Serialize()
    public FileName: string = "";

    @Serialize()
    public FilePath: string = "";
    
    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.iconPath = new vscode.ThemeIcon("file-symlink-file", new vscode.ThemeColor("charts.blue"));
        this.FileName = label;

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());

        this.EnableNodeAlias = true;
        this.SetContextValue();
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    private handleNodeOpen(): void {
        ui.openFile(this.FilePath);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('FileNode', FileNode);