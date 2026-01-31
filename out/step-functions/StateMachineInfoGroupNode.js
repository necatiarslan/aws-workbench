"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
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