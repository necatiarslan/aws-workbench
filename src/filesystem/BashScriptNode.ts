import { NodeBase } from '../../tree/NodeBase';
import { Serialize } from '../../common/serialization/Serialize';
import { NodeRegistry } from '../../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../../tree/ServiceHub';
import { TreeState } from '../../tree/TreeState';

export class BashScriptNode extends NodeBase {

    constructor(Title: string, parent?: NodeBase) 
    {
        super(Title, parent);
        this.Icon = "debug-console";
        this.Title = Title;

        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.EnableNodeEdit = true;
        this.EnableNodeRun = true;
        this.SetContextValue();
    }

    @Serialize()
    public Title: string = "";

    @Serialize()
    public Script: string = "";

    public async NodeAdd(): Promise<void> {

    }

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        vscode.window.showInformationMessage(`${this.Title}`, { modal: true, detail: this.Script });

    }

    public async NodeEdit(): Promise<void> {
        let scriptContent = await vscode.window.showInputBox({ placeHolder: 'Script', value: this.Script });
        if(!scriptContent){ return; }
        this.Script = scriptContent;
        TreeState.save();   
    }

    public NodeRun(): void {
        this.StartWorking();
        vscode.window.createTerminal(this.Title).sendText(this.Script);
        this.StopWorking();
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('BashScriptNode', BashScriptNode);