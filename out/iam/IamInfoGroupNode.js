"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const IamInfoNode_1 = require("./IamInfoNode");
class IamInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    // Info items to display - set by parent node before refresh
    InfoItems = [];
    async handleNodeRefresh() {
        // Clear existing children
        this.Children = [];
        // Add info items as children
        for (const item of this.InfoItems) {
            const infoNode = new IamInfoNode_1.IamInfoNode(item.key, item.value, this);
            infoNode.InfoKey = item.key;
            infoNode.InfoValue = item.value;
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.RefreshTree();
    }
    SetInfoItems(items) {
        this.InfoItems = items;
    }
}
exports.IamInfoGroupNode = IamInfoGroupNode;
//# sourceMappingURL=IamInfoGroupNode.js.map