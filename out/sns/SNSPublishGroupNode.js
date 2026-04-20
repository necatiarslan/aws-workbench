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
exports.SNSPublishGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const SNSPublishAdhocNode_1 = require("./SNSPublishAdhocNode");
const SNSPublishFileNode_1 = require("./SNSPublishFileNode");
class SNSPublishGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "send";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeLoaded.subscribe(() => this.handleNodeLoaded());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    LoadDefaultChildren() {
        new SNSPublishAdhocNode_1.SNSPublishAdhocNode("Adhoc", this);
    }
    handleNodeLoaded() {
        // Restore message file nodes from parent's MessageFiles array
        const topicNode = this.Parent;
        if (topicNode && topicNode.MessageFiles) {
            for (const file of topicNode.MessageFiles) {
                new SNSPublishFileNode_1.SNSPublishFileNode(file.path, file.id, this);
            }
        }
    }
    async handleNodeAdd() {
        ui.logToOutput('SNSPublishGroupNode.handleNodeAdd Started');
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Message File',
            canSelectFiles: true,
            filters: {
                'JSON files': ['json'],
                'Text files': ['txt'],
                'All files': ['*']
            }
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        const filePath = selectedPath[0].fsPath;
        // Add to parent's MessageFiles array
        const topicNode = this.Parent;
        if (topicNode) {
            const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            topicNode.MessageFiles.push({ id, path: filePath });
            // Create the file node
            new SNSPublishFileNode_1.SNSPublishFileNode(filePath, id, this);
            this.TreeSave();
            this.RefreshTree();
            ui.showInfoMessage('Message file added successfully');
        }
    }
}
exports.SNSPublishGroupNode = SNSPublishGroupNode;
//# sourceMappingURL=SNSPublishGroupNode.js.map