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
exports.StateMachineExecutionsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const StateMachineExecutionFilterGroupNode_1 = require("./StateMachineExecutionFilterGroupNode");
const ui = __importStar(require("../common/UI"));
const StateMachineExecutionsReportView_1 = require("./StateMachineExecutionsReportView");
class StateMachineExecutionsGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "history";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeView.subscribe(() => { this.handleNodeView(); });
        this.SetContextValue();
    }
    async handleViewExecutionsReport() {
    }
    async handleNodeView() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode) {
            ui.showInfoMessage("State Machine not found.");
            return;
        }
        StateMachineExecutionsReportView_1.StateMachineExecutionsReportView.Render(stateMachineNode.Region, stateMachineNode.StateMachineArn, stateMachineNode.StateMachineName);
    }
    async handleNodeAdd() {
        const stateMachineNode = this.GetAwsResourceNode();
        if (!stateMachineNode) {
            ui.showInfoMessage("State Machine not found.");
            return;
        }
        //ask user execution start date
        const startDateInput = await vscode.window.showInputBox({
            prompt: 'Enter the start date for executions (YYYY-MM-DD)',
            placeHolder: '2026-01-01',
            value: new Date().toISOString().split('T')[0],
            validateInput: (value) => {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return 'Invalid date format. Please use YYYY-MM-DD.';
                }
                return null;
            }
        });
        if (!startDateInput) {
            return; // User cancelled input
        }
        //ask user execution name filter
        const nameFilterInput = await vscode.window.showInputBox({
            prompt: 'Enter the execution name filter (optional)',
            placeHolder: 'Execution Name Filter'
        });
        let filterName = startDateInput;
        if (nameFilterInput) {
            filterName = filterName + " [" + (nameFilterInput ? nameFilterInput.trim() : "") + "]";
        }
        // Create and configure the new filter node
        const filterNode = new StateMachineExecutionFilterGroupNode_1.StateMachineExecutionFilterGroupNode(filterName || "New Filter", this);
        filterNode.StartDate = new Date(startDateInput);
        filterNode.StartDate.setHours(0, 0, 0, 0);
        if (nameFilterInput && nameFilterInput.trim().length > 0) {
            filterNode.ExecutionName = nameFilterInput.trim();
        }
        stateMachineNode.AddExecutionFilter(filterNode.NodeId, filterNode.StartDate, filterNode.ExecutionName, filterNode.StatusFilter);
    }
    async handleLoadChildren() {
        this.handleNodeRefresh();
    }
    async handleNodeRefresh() {
        // Clear and reload children
        this.Children = [];
        const todayFilterNode = new StateMachineExecutionFilterGroupNode_1.StateMachineExecutionFilterGroupNode("Today", this);
        todayFilterNode.StartDate = new Date();
        todayFilterNode.StartDate.setHours(0, 0, 0, 0);
        const stateMachineNode = this.GetAwsResourceNode();
        if (stateMachineNode && stateMachineNode.ExecutionFilters) {
            for (const filter of stateMachineNode.ExecutionFilters) {
                let filterName = new Date(filter.startDate).toISOString().split('T')[0];
                if (filter.executionName) {
                    filterName = filterName + " [" + (filter.executionName ? filter.executionName.trim() : "") + "]";
                }
                const filterNode = new StateMachineExecutionFilterGroupNode_1.StateMachineExecutionFilterGroupNode(filterName, this);
                filterNode.NodeId = filter.NodeId;
                filterNode.StartDate = new Date(filter.startDate);
                filterNode.ExecutionName = filter.executionName;
                filterNode.StatusFilter = filter.statusFilter;
            }
        }
    }
}
exports.StateMachineExecutionsGroupNode = StateMachineExecutionsGroupNode;
//# sourceMappingURL=StateMachineExecutionsGroupNode.js.map