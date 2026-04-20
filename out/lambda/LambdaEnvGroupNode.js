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
exports.LambdaEnvGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const LambdaEnvNode_1 = require("./LambdaEnvNode");
class LambdaEnvGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "symbol-property";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeAdd() {
        //TODO: Implement adding new environment variable logic here
    }
    async handleNodeRefresh() {
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
        // if (this.Children.length > 0) {
        //     this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        // } else {
        //     this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        // }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.LambdaEnvGroupNode = LambdaEnvGroupNode;
//# sourceMappingURL=LambdaEnvGroupNode.js.map