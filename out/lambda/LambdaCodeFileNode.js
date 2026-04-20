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
exports.LambdaCodeFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
class LambdaCodeFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        this.SetContextValue();
    }
    async handleNodeAdd() {
        ui.logToOutput('LambdaCodeFileNode.NodeAdd Started');
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Code File or Folder',
            canSelectFiles: true,
            canSelectFolders: true,
            filters: {
                'All Files': ['*'],
                'ZIP Files': ['zip'],
                'Python Files': ['py'],
                'JavaScript Files': ['js'],
                'TypeScript Files': ['ts']
            }
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        const lambdaNode = this.GetAwsResourceNode();
        lambdaNode.CodePath = selectedPath[0].fsPath;
        this.label = `Code Path: ${lambdaNode.CodePath}`;
        this.TreeSave();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Set Successfully');
        this.RefreshTree();
    }
    async handleNodeRemove() {
        ui.logToOutput('LambdaCodeFileNode.handleNodeRemove Started');
        const lambdaNode = this.GetAwsResourceNode();
        lambdaNode.CodePath = '';
        this.label = 'Select File';
        this.TreeSave();
        ui.logToOutput('Code Path: ' + lambdaNode.CodePath);
        ui.showInfoMessage('Code Path Removed Successfully');
        this.RefreshTree();
    }
    async handleNodeEdit() {
        ui.logToOutput('LambdaCodeFileNode.NodeEdit Started');
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode.CodePath || lambdaNode.CodePath.trim().length === 0) {
            ui.showWarningMessage('No file path set. Please add a code path first.');
            return;
        }
        try {
            const fileUri = vscode.Uri.file(lambdaNode.CodePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
            ui.logToOutput('Opened file for editing: ' + lambdaNode.CodePath);
        }
        catch (error) {
            ui.logToOutput('LambdaCodeFileNode.NodeEdit Error !!!', error);
            ui.showErrorMessage('Failed to open file for editing', error);
        }
    }
    async handleNodeLoaded() {
        const lambdaNode = this.GetAwsResourceNode();
        if (lambdaNode.CodePath && lambdaNode.CodePath.trim().length > 0) {
            this.label = lambdaNode.CodePath;
        }
        else {
            this.label = 'Select File';
        }
    }
}
exports.LambdaCodeFileNode = LambdaCodeFileNode;
//# sourceMappingURL=LambdaCodeFileNode.js.map