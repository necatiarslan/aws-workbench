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
exports.LambdaEnvNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const api = __importStar(require("./API"));
class LambdaEnvNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "circle-filled";
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.SetContextValue();
    }
    Key = "";
    Value = "";
    async handleNodeEdit() {
        ui.logToOutput('LambdaEnvNode.NodeEdit Started');
        // Resolve the parent Lambda function node to get region/name
        const lambdaNode = this.GetAwsResourceNode();
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
        this.label = `${this.Key} = ${newValue}`;
        ui.showInfoMessage('Environment Variable Updated Successfully');
        // Refresh parent group to reload variables
        if (this.Parent) {
            this.Parent.NodeRefresh();
        }
        else {
            this.RefreshTree();
        }
        this.StopWorking();
    }
}
exports.LambdaEnvNode = LambdaEnvNode;
//# sourceMappingURL=LambdaEnvNode.js.map