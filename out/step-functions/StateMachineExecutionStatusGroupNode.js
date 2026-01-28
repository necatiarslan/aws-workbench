"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineExecutionStatusGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const api = require("./API");
const StateMachineExecutionNode_1 = require("./StateMachineExecutionNode");
class StateMachineExecutionStatusGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent, statusFilter) {
        super(label, parent);
        this.Icon = "folder";
        this.StatusFilter = statusFilter;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    StatusFilter;
    async handleLoadChildren() {
        const execGroupNode = this.Parent;
        const stateMachineNode = execGroupNode?.Parent;
        if (!stateMachineNode)
            return;
        this.StartWorking();
        try {
            if (!stateMachineNode.StateMachineArn) {
                this.StopWorking();
                return;
            }
            const result = await api.ListExecutions(stateMachineNode.Region, stateMachineNode.StateMachineArn, this.StatusFilter);
            if (result.isSuccessful && result.result) {
                // Clear existing execution nodes
                this.Children = [];
                // Add execution nodes (limit to 50 most recent)
                const executions = result.result.slice(0, 50);
                for (const exec of executions) {
                    if (exec.executionArn && exec.name) {
                        const startTime = exec.startDate ? exec.startDate.toLocaleString() : 'Unknown';
                        const status = exec.status || 'Unknown';
                        const label = `${exec.name} [${status}] - ${startTime}`;
                        const execNode = new StateMachineExecutionNode_1.StateMachineExecutionNode(label, this);
                        execNode.ExecutionArn = exec.executionArn;
                        execNode.Status = status;
                        execNode.StartDate = startTime;
                        if (exec.stopDate) {
                            execNode.StopDate = exec.stopDate.toLocaleString();
                        }
                        else {
                            execNode.StopDate = '';
                        }
                    }
                }
                if (executions.length === 0) {
                    ui.logToOutput(`No executions found for status filter: ${this.StatusFilter || 'all'}`);
                }
            }
        }
        catch (error) {
            ui.logToOutput('StateMachineExecutionStatusGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load executions', error);
        }
        this.StopWorking();
    }
    async handleNodeRefresh() {
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }
}
exports.StateMachineExecutionStatusGroupNode = StateMachineExecutionStatusGroupNode;
//# sourceMappingURL=StateMachineExecutionStatusGroupNode.js.map