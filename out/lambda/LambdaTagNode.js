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
exports.LambdaTagNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class LambdaTagNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "circle-filled";
        this.Label = Label;
        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.EnableNodeEdit = true;
        this.EnableNodeRemove = true;
        this.SetContextValue();
    }
    Label = "";
    Key = "";
    Value = "";
    async NodeAdd() {
    }
    async NodeRemove() {
        ui.logToOutput('LambdaTagNode.NodeRemove Started');
        if (!this.Key) {
            return;
        }
        const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to remove tag "${this.Key}"?`, { modal: true }, 'Yes', 'No');
        if (confirmation !== 'Yes') {
            return;
        }
        // Resolve the parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaTagNode.NodeRemove - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get Lambda ARN
        const lambdaResult = await api.GetLambda(lambdaNode.Region, lambdaNode.FunctionName);
        if (!lambdaResult.isSuccessful || !lambdaResult.result.Configuration?.FunctionArn) {
            ui.logToOutput('api.GetLambda Error !!!', lambdaResult.error);
            ui.showErrorMessage('Get Lambda Error !!!', lambdaResult.error);
            this.StopWorking();
            return;
        }
        const lambdaArn = lambdaResult.result.Configuration.FunctionArn;
        // Remove tag
        const result = await api.RemoveLambdaTag(lambdaNode.Region, lambdaArn, this.Key);
        if (!result.isSuccessful) {
            ui.logToOutput('api.RemoveLambdaTag Error !!!', result.error);
            ui.showErrorMessage('Remove Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Removed Successfully');
        // Refresh the parent tags group to reflect changes
        this.Parent?.NodeRefresh();
        this.StopWorking();
    }
    NodeRefresh() {
        this.Parent?.NodeRefresh();
    }
    NodeView() {
    }
    async NodeEdit() {
        ui.logToOutput('LambdaTagNode.NodeEdit Started');
        // Prompt for new value (allow empty string, but not undefined/cancel)
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        if (newValue === undefined) {
            return;
        }
        if (!this.Key) {
            return;
        }
        // Resolve the parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaTagNode.NodeEdit - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get Lambda ARN
        const lambdaResult = await api.GetLambda(lambdaNode.Region, lambdaNode.FunctionName);
        if (!lambdaResult.isSuccessful || !lambdaResult.result.Configuration?.FunctionArn) {
            ui.logToOutput('api.GetLambda Error !!!', lambdaResult.error);
            ui.showErrorMessage('Get Lambda Error !!!', lambdaResult.error);
            this.StopWorking();
            return;
        }
        const lambdaArn = lambdaResult.result.Configuration.FunctionArn;
        // Update tag (same API as add; overwrites existing)
        const result = await api.UpdateLambdaTag(lambdaNode.Region, lambdaArn, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput('api.UpdateLambdaTag Error !!!', result.error);
            ui.showErrorMessage('Update Tag Error !!!', result.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Updated Successfully');
        // Refresh the parent tags group to show updated values
        this.Parent?.NodeRefresh();
        this.StopWorking();
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
exports.LambdaTagNode = LambdaTagNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaTagNode.prototype, "Label", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaTagNode.prototype, "Key", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaTagNode.prototype, "Value", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaTagNode', LambdaTagNode);
//# sourceMappingURL=LambdaTagNode.js.map