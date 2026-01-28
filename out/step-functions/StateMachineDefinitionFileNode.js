"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const fs = require("fs");
const TreeState_1 = require("../tree/TreeState");
const TreeProvider_1 = require("../tree/TreeProvider");
const StateMachineStudioView_1 = require("./StateMachineStudioView");
const Session_1 = require("../common/Session");
class StateMachineDefinitionFileNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "file-code";
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.SetContextValue();
    }
    async handleNodeLoaded() {
        //TODO: do not work
        const stateMachineNode = this.GetAwsResourceNode();
        if (stateMachineNode.CodePath && stateMachineNode.CodePath.trim().length > 0) {
            this.label = stateMachineNode.CodePath;
        }
        else {
            this.label = 'Select File';
        }
    }
    async handleNodeView() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        if (!stateMachineNode.CodePath) {
            ui.showWarningMessage('Please set definition file first');
            return;
        }
        StateMachineStudioView_1.StateMachineStudioView.Render(Session_1.Session.Current.ExtensionUri, stateMachineNode.StateMachineName, stateMachineNode.CodePath);
    }
    async handleNodeAdd() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        //ask user to select a json file and update stateMachineNode.CodePath
        const uri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select File',
            filters: { 'JSON': ['json'] }
        });
        if (uri && uri.length > 0) {
            const filePath = uri[0].fsPath;
            stateMachineNode.CodePath = filePath;
            this.label = `File: ${stateMachineNode.CodePath}`;
            TreeState_1.TreeState.save();
            ui.logToOutput('File: ' + stateMachineNode.CodePath);
            ui.showInfoMessage('Definition file set successfully');
            TreeProvider_1.TreeProvider.Current.Refresh(this);
        }
    }
    async handleNodeEdit() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        if (!stateMachineNode.CodePath) {
            ui.showWarningMessage('Please set definition file first');
            return;
        }
        this.StartWorking();
        try {
            if (fs.existsSync(stateMachineNode.CodePath)) {
                ui.openFile(stateMachineNode.CodePath);
            }
            else {
                ui.showWarningMessage('Definition file not found');
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineDefinitionFileNode.handleNodeEdit Error !!!', error);
            ui.showErrorMessage('Failed to view definition', error);
        }
        this.StopWorking();
    }
    async handleNodeRemove() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode)
            return;
        stateMachineNode.CodePath = '';
        this.label = 'Select File';
        TreeState_1.TreeState.save();
        ui.logToOutput('Definition file removed: ' + stateMachineNode.CodePath);
        ui.showInfoMessage('Definition file removed successfully');
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
}
exports.StateMachineDefinitionFileNode = StateMachineDefinitionFileNode;
//# sourceMappingURL=StateMachineDefinitionFileNode.js.map