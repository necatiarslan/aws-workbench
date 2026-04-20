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
exports.StateMachineInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const StateMachineInfoNode_1 = require("./StateMachineInfoNode");
class StateMachineInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('StateMachineInfoGroupNode.NodeRefresh Started');
        // Get the parent StateMachine node
        const stateMachineNode = this.Parent;
        if (!stateMachineNode || !stateMachineNode.StateMachineName) {
            ui.logToOutput('StateMachineInfoGroupNode.NodeRefresh - Parent StateMachine node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get state machine definition
        const definition = await stateMachineNode.GetDefinition();
        if (!definition) {
            ui.logToOutput('StateMachineInfoGroupNode.NodeRefresh - Failed to get definition');
            ui.showErrorMessage('Failed to get state machine definition', new Error('Definition is undefined'));
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add info items as children
        const infoItems = [
            { key: 'Name', value: definition.name || 'N/A' },
            { key: 'ARN', value: definition.stateMachineArn || stateMachineNode.StateMachineArn || 'N/A' },
            { key: 'Type', value: definition.type || 'N/A' },
            { key: 'Status', value: definition.status || 'N/A' },
            { key: 'RoleArn', value: definition.roleArn || 'N/A' },
            { key: 'CreationDate', value: definition.creationDate || 'N/A' },
            { key: 'LoggingLevel', value: definition.loggingConfiguration?.level || 'N/A' },
            { key: 'IncludeExecutionData', value: definition.loggingConfiguration?.includeExecutionData?.toString() || 'N/A' }
        ];
        for (const item of infoItems) {
            new StateMachineInfoNode_1.StateMachineInfoNode(item.key, item.value, this);
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.StateMachineInfoGroupNode = StateMachineInfoGroupNode;
//# sourceMappingURL=StateMachineInfoGroupNode.js.map