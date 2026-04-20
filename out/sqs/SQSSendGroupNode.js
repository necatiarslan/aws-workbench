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
exports.SQSSendGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const uuid_1 = require("uuid");
const SQSSendAdhocNode_1 = require("./SQSSendAdhocNode");
const SQSSendFileNode_1 = require("./SQSSendFileNode");
const SQSQueueNode_1 = require("./SQSQueueNode");
class SQSSendGroupNode extends NodeBase_1.NodeBase {
    constructor(label, parent) {
        super(label, parent);
        this.Icon = "send";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        // Attach event handlers
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    async LoadDefaultChildren() {
        new SQSSendAdhocNode_1.SQSSendAdhocNode("Adhoc", this);
        // Load any saved message files from parent queue node
        const queueNode = this.GetQueueNode();
        if (queueNode && queueNode.MessageFiles) {
            for (const file of queueNode.MessageFiles) {
                new SQSSendFileNode_1.SQSSendFileNode(file.path, this, file.id);
            }
        }
    }
    GetQueueNode() {
        if (this.Parent instanceof SQSQueueNode_1.SQSQueueNode) {
            return this.Parent;
        }
        return undefined;
    }
    async handleNodeAdd() {
        ui.logToOutput('SQSSendGroupNode.handleNodeAdd Started');
        const options = {
            canSelectMany: false,
            openLabel: 'Select Message File',
            filters: {
                'JSON Files': ['json'],
                'Text Files': ['txt'],
                'All Files': ['*']
            }
        };
        const fileUri = await vscode.window.showOpenDialog(options);
        if (!fileUri || fileUri.length === 0) {
            return;
        }
        const filePath = fileUri[0].fsPath;
        const queueNode = this.GetQueueNode();
        if (queueNode) {
            const id = (0, uuid_1.v4)();
            queueNode.MessageFiles.push({ id, path: filePath });
            new SQSSendFileNode_1.SQSSendFileNode(filePath, this, id);
            this.TreeSave();
        }
    }
}
exports.SQSSendGroupNode = SQSSendGroupNode;
//# sourceMappingURL=SQSSendGroupNode.js.map