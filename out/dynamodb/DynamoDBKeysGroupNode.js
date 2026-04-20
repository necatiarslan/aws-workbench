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
exports.DynamoDBKeysGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const DynamoDBKeyNode_1 = require("./DynamoDBKeyNode");
class DynamoDBKeysGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "key";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh - Parent table node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const details = await tableNode.TableDetails;
            if (!details) {
                this.StopWorking();
                return;
            }
            // Clear existing children
            this.Children = [];
            // Add partition key
            if (details.partitionKey) {
                const keyNode = new DynamoDBKeyNode_1.DynamoDBKeyNode(`${details.partitionKey.name} (${details.partitionKey.type})`, this);
                keyNode.KeyName = details.partitionKey.name;
                keyNode.KeyType = details.partitionKey.type;
                keyNode.KeyRole = 'HASH';
            }
            // Add sort key if exists
            if (details.sortKey) {
                const keyNode = new DynamoDBKeyNode_1.DynamoDBKeyNode(`${details.sortKey.name} (${details.sortKey.type})`, this);
                keyNode.KeyName = details.sortKey.name;
                keyNode.KeyType = details.sortKey.type;
                keyNode.KeyRole = 'RANGE';
            }
            if (this.Children.length > 0) {
                this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBKeysGroupNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Keys Error !!!', error);
        }
        finally {
            this.StopWorking();
            this.RefreshTree();
        }
    }
}
exports.DynamoDBKeysGroupNode = DynamoDBKeysGroupNode;
//# sourceMappingURL=DynamoDBKeysGroupNode.js.map