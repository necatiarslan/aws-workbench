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
exports.LambdaEnvNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
const TreeProvider_1 = require("../tree/TreeProvider");
class LambdaEnvNode extends NodeBase_1.NodeBase {
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
    NodeRemove() {
        //TODO: Implement environment variable removal logic here
    }
    NodeRefresh() {
        this.Parent?.NodeRefresh();
    }
    NodeView() {
    }
    async NodeEdit() {
        ui.logToOutput('LambdaEnvNode.NodeEdit Started');
        // Resolve the parent Lambda function node to get region/name
        const lambdaNode = this.Parent?.Parent;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaEnvNode.NodeEdit - Parent Lambda node not found');
            return;
        }
        if (!this.Key) {
            ui.logToOutput('LambdaEnvNode.NodeEdit - Environment variable key missing');
            return;
        }
        const newValue = await vscode.window.showInputBox({
            value: this.Value,
            placeHolder: 'Enter New Value for ' + this.Key
        });
        // User canceled input
        if (newValue === undefined) {
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        const result = await api.UpdateLambdaEnvironmentVariable(lambdaNode.Region, lambdaNode.FunctionName, this.Key, newValue);
        if (!result.isSuccessful) {
            ui.logToOutput("api.UpdateLambdaEnvironmentVariable Error !!!", result.error);
            ui.showErrorMessage('Update Environment Variable Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Update local state and UI
        this.Value = newValue;
        this.Label = `${this.Key} = ${newValue}`;
        ui.showInfoMessage('Environment Variable Updated Successfully');
        // Refresh parent group to reload variables
        if (this.Parent) {
            this.Parent.NodeRefresh();
        }
        else {
            TreeProvider_1.TreeProvider.Current.Refresh(this);
        }
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
exports.LambdaEnvNode = LambdaEnvNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaEnvNode.prototype, "Label", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaEnvNode.prototype, "Key", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaEnvNode.prototype, "Value", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaEnvNode', LambdaEnvNode);
//# sourceMappingURL=LambdaEnvNode.js.map