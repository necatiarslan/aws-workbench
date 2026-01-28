"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachineDefinitionGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const StateMachineDefinitionFileNode_1 = require("./StateMachineDefinitionFileNode");
const StateMachineDefinitionDownloadNode_1 = require("./StateMachineDefinitionDownloadNode");
const StateMachineDefinitionCompareNode_1 = require("./StateMachineDefinitionCompareNode");
const StateMachineDefinitionUpdateNode_1 = require("./StateMachineDefinitionUpdateNode");
class StateMachineDefinitionGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "json";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        this.SetContextValue();
    }
    handleLoadChildren() {
        if (this.Children.length === 0) {
            new StateMachineDefinitionFileNode_1.StateMachineDefinitionFileNode("Select File", this);
            new StateMachineDefinitionDownloadNode_1.StateMachineDefinitionDownloadNode("Download", this);
            new StateMachineDefinitionCompareNode_1.StateMachineDefinitionCompareNode("Compare", this);
            new StateMachineDefinitionUpdateNode_1.StateMachineDefinitionUpdateNode("Update", this);
        }
    }
}
exports.StateMachineDefinitionGroupNode = StateMachineDefinitionGroupNode;
//# sourceMappingURL=StateMachineDefinitionGroupNode.js.map