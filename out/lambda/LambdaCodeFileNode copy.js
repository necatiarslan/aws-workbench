"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeFileNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const ui = require("../common/UI");
const TreeProvider_1 = require("../tree/TreeProvider");
const TreeState_1 = require("../tree/TreeState");
class LambdaCodeFileNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "file-code";
        this.Label = Label;
        //this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRemove = true;
        this.EnableNodeEdit = true;
        this.SetContextValue();
    }
    Label = "";
    async NodeAdd() {
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
        this.GetAwsResourceNode().CodePath = selectedPath[0].fsPath;
        this.Label = `Code Path: ${this.GetAwsResourceNode().CodePath}`;
        TreeState_1.TreeState.save();
        ui.logToOutput('Code Path: ' + this.GetAwsResourceNode().CodePath);
        ui.showInfoMessage('Code Path Set Successfully');
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    NodeRemove() {
        ui.logToOutput('LambdaCodeFileNode.NodeRemove Started');
        this.GetAwsResourceNode().CodePath = '';
        this.Label = 'Select File';
        TreeState_1.TreeState.save();
        ui.logToOutput('Code Path: ' + this.GetAwsResourceNode().CodePath);
        ui.showInfoMessage('Code Path Removed Successfully');
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    NodeRefresh() {
    }
    NodeView() {
    }
    async NodeEdit() {
        ui.logToOutput('LambdaCodeFileNode.NodeEdit Started');
        if (!this.GetAwsResourceNode().CodePath || this.GetAwsResourceNode().CodePath.trim().length === 0) {
            ui.showWarningMessage('No file path set. Please add a code path first.');
            return;
        }
        try {
            const fileUri = vscode.Uri.file(this.GetAwsResourceNode().CodePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
            ui.logToOutput('Opened file for editing: ' + this.GetAwsResourceNode().CodePath);
        }
        catch (error) {
            ui.logToOutput('LambdaCodeFileNode.NodeEdit Error !!!', error);
            ui.showErrorMessage('Failed to open file for editing', error);
        }
    }
    NodeRun() {
    }
    NodeStop() {
    }
    NodeOpen() {
    }
    NodeInfo() {
    }
}
exports.LambdaCodeFileNode = LambdaCodeFileNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaCodeFileNode.prototype, "Label", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaCodeFileNode', LambdaCodeFileNode);
//# sourceMappingURL=LambdaCodeFileNode%20copy.js.map