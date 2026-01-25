import { Serialize } from '../common/serialization';
import { NodeBase } from '../tree/NodeBase';
import { TreeState } from '../tree/TreeState';
import * as ui from '../common/UI'
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';

export class BashFileNode extends NodeBase {


    @Serialize()
    public FileName: string = "";

    @Serialize()
    public FilePath: string = "";
    
    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "debug-alt";
        this.FileName = label;

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());

        this.EnableNodeAlias = true;
        this.SetContextValue();
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private handleNodeRun(): void {
        //run the bash file in a new terminal
        this.StartWorking();
        vscode.window.createTerminal(this.FileName).sendText(this.FilePath);
        this.StopWorking();
    }

    private handleNodeOpen(): void {
        ui.openFile(this.FilePath);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('BashFileNode', BashFileNode);