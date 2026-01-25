"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VscodeService = void 0;
const vscode = require("vscode");
const ServiceBase_1 = require("../tree/ServiceBase");
const ui = require("../common/UI");
const CommandNode_1 = require("./CommandNode");
const TreeState_1 = require("../tree/TreeState");
class VscodeService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        VscodeService.Current = this;
    }
    async Add(node, type) {
        // Implementation for adding a file system resource
        if (type === "Command") {
            let command = await vscode.window.showInputBox({ placeHolder: 'Enter Command Id' });
            if (!command) {
                return;
            }
            const vsCommand = await vscode.commands.getCommands(true).then(commands => commands.find(cmd => cmd === command));
            if (!vsCommand) {
                ui.showInfoMessage(`Command '${command}' not found in VSCode commands.`);
                return;
            }
            let title = await vscode.window.showInputBox({ placeHolder: 'Enter Command Title', value: command });
            if (!title) {
                return;
            }
            const commandNode = new CommandNode_1.CommandNode(title, node);
            commandNode.Command = command;
            TreeState_1.TreeState.save();
        }
    }
}
exports.VscodeService = VscodeService;
//# sourceMappingURL=VscodeService.js.map