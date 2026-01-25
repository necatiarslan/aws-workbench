import * as vscode from "vscode";
import { ServiceBase } from "../tree/ServiceBase";
import { NodeBase } from "../tree/NodeBase";
import * as ui from "../common/UI";
import { CommandNode } from "./CommandNode";
import { TreeState } from "../tree/TreeState";

export class VscodeService extends ServiceBase {   

    public static Current: VscodeService;

    public constructor() {
        super();
        VscodeService.Current = this;
    }

    public async Add(node?: NodeBase, type?: string) : Promise<void> {
        // Implementation for adding a file system resource
        if(type === "Command"){
            let command = await vscode.window.showInputBox({placeHolder: 'Enter Command Id'});
            if(!command){ return; }
            const vsCommand = await vscode.commands.getCommands(true).then(commands => 
                commands.find(cmd => cmd === command)
            );
            if(!vsCommand){ 
                ui.showInfoMessage(`Command '${command}' not found in VSCode commands.`);
                return; 
            }
            let title = await vscode.window.showInputBox({placeHolder: 'Enter Command Title', value: command});
            if(!title){ return; }
            const commandNode = new CommandNode(title, node);
            commandNode.Command = command;
            TreeState.save();
        }

    }
}