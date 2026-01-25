import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { TreeState } from '../tree/TreeState';

export class CommandNode extends NodeBase {

    @Serialize()
    public Title: string = "";

    @Serialize()
    public Command: string = "";

    constructor(Title: string, parent?: NodeBase) 
    {
        super(Title, parent);
        this.Icon = "terminal";
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
        TreeState.save();
    }

    private handleNodeView(): void {
        vscode.window.showInformationMessage(`${this.Title}`, { modal: true, detail: this.Command });
    }

    private async handleNodeEdit(): Promise<void> {
        let commandContent = await vscode.window.showInputBox({ placeHolder: 'Command', value: this.Command });
        if(!commandContent){ return; }
        this.Command = commandContent;
        TreeState.save();   
    }

    private handleNodeRun(): void {
        vscode.commands.executeCommand(this.Command);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('CommandNode', CommandNode);