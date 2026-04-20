"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const fs = __importStar(require("fs"));
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
            this.TreeSave();
            ui.logToOutput('File: ' + stateMachineNode.CodePath);
            ui.showInfoMessage('Definition file set successfully');
            this.RefreshTree();
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
        this.TreeSave();
        ui.logToOutput('Definition file removed: ' + stateMachineNode.CodePath);
        ui.showInfoMessage('Definition file removed successfully');
        this.RefreshTree();
    }
}
exports.StateMachineDefinitionFileNode = StateMachineDefinitionFileNode;
//# sourceMappingURL=StateMachineDefinitionFileNode.js.map