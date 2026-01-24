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

        this.EnableNodeRemove = true;
        this.EnableNodeOpen = true;
        this.EnableNodeRun = true;
        this.EnableNodeAlias = true;
        this.SetContextValue();
    }

    public NodeAdd(): void {
    }

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        
    }

    public NodeEdit(): void {
    }

    public NodeRun(): void {
        //run the bash file in a new terminal
        this.StartWorking();
        vscode.window.createTerminal(this.FileName).sendText(this.FilePath);
        this.StopWorking();
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
        ui.openFile(this.FilePath);
    }

    public NodeInfo(): void {
    }

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('BashFileNode', BashFileNode);