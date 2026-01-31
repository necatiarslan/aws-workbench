import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class BashScriptNode extends NodeBase {

    @Serialize()
    public Title: string = "";

    @Serialize()
    public Script: string = "";

    constructor(Title: string, parent?: NodeBase) 
    {
        super(Title, parent);
        this.Icon = "debug-console";
        this.Title = Title;

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());


        this.EnableNodeAlias = true;
        this.SetContextValue();
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    private handleNodeView(): void {
        vscode.window.showInformationMessage(`${this.Title}`, { modal: true, detail: this.Script });
    }

    private async handleNodeEdit(): Promise<void> {
        let scriptContent = await vscode.window.showInputBox({ placeHolder: 'Script', value: this.Script });
        if(!scriptContent){ return; }
        this.Script = scriptContent;
        this.TreeSave();   
    }

    private handleNodeRun(): void {
        this.StartWorking();
        vscode.window.createTerminal(this.Title).sendText(this.Script);
        this.StopWorking();
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('BashScriptNode', BashScriptNode);