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
exports.StateMachineExecutionFilterGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const api = __importStar(require("./API"));
const StateMachineExecutionNode_1 = require("./StateMachineExecutionNode");
class StateMachineExecutionFilterGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "folder";
        this.NodeId = new Date().getTime().toString();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.SetContextValue();
    }
    NodeId;
    StartDate;
    ExecutionName;
    StatusFilter;
    async handleNodeRemove() {
        this.Remove();
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode) {
            ui.showInfoMessage("State Machine node not found.");
            return;
        }
        stateMachineNode.RemoveExecutionFilter(this.NodeId);
    }
    ;
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
            const result = await api.ListExecutions(stateMachineNode.Region, stateMachineNode.StateMachineArn, this.StatusFilter, undefined, this.StartDate);
            if (result.isSuccessful && result.result) {
                // Clear existing execution nodes
                this.Children = [];
                // Add execution nodes (limit to 50 most recent)
                const executions = result.result;
                for (const exec of executions) {
                    if (exec.executionArn && exec.name) {
                        if (this.ExecutionName && !exec.name.includes(this.ExecutionName)) {
                            continue;
                        }
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
exports.StateMachineExecutionFilterGroupNode = StateMachineExecutionFilterGroupNode;
//# sourceMappingURL=StateMachineExecutionFilterGroupNode.js.map