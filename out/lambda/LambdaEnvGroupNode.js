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
exports.LambdaEnvGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const LambdaEnvNode_1 = require("./LambdaEnvNode");
const TreeProvider_1 = require("../tree/TreeProvider");
class LambdaEnvGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "symbol-property";
        this.Label = Label;
        this.ShouldBeSaved = false;
        this.EnableNodeRefresh = true;
        this.EnableNodeAdd = true;
        this.SetContextValue();
    }
    Label = "";
    async NodeAdd() {
        //TODO: Implement adding new environment variable logic here
    }
    NodeRemove() {
    }
    async NodeRefresh() {
        ui.logToOutput('LambdaEnvGroupNode.NodeRefresh Started');
        // Get the parent Lambda function node
        let lambdaNode = this.Parent;
        if (!lambdaNode || !lambdaNode.FunctionName) {
            ui.logToOutput('LambdaEnvGroupNode.NodeRefresh - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        let result = await api.GetLambdaConfiguration(lambdaNode.Region, lambdaNode.FunctionName);
        if (!result.isSuccessful) {
            ui.logToOutput("api.GetLambdaConfiguration Error !!!", result.error);
            ui.showErrorMessage('Get Lambda Configuration Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add environment variables as children
        if (result.result.Environment && result.result.Environment.Variables) {
            const envVars = result.result.Environment.Variables;
            for (let key in envVars) {
                let envVarNode = new LambdaEnvNode_1.LambdaEnvNode(`${key} = ${envVars[key]}`, this);
                envVarNode.Key = key;
                envVarNode.Value = envVars[key] || "";
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        this.StopWorking();
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    NodeView() {
    }
    async NodeEdit() {
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
exports.LambdaEnvGroupNode = LambdaEnvGroupNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaEnvGroupNode.prototype, "Label", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaEnvGroupNode', LambdaEnvGroupNode);
//# sourceMappingURL=LambdaEnvGroupNode.js.map