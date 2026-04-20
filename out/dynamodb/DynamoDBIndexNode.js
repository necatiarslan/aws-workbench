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
exports.DynamoDBIndexNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
const ServiceHub_1 = require("../tree/ServiceHub");
class DynamoDBIndexNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "list-tree";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    IndexName = "";
    IndexType = ""; // GSI or LSI
    Keys = "";
    KeySchema = [];
    Region = "";
    TableName = "";
    TableDetails = undefined;
    async handleNodeRun() {
        // Open Query View with this index pre-selected
        ui.logToOutput('DynamoDBIndexNode.handleNodeRun - Opening Query View with index: ' + this.IndexName);
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            if (this.TableDetails) {
                const { DynamoDBQueryView } = await Promise.resolve().then(() => __importStar(require('./DynamoDBQueryView')));
                DynamoDBQueryView.Render(ServiceHub_1.ServiceHub.Current.Context.extensionUri, this.Region, this.TableName, this.TableDetails, this.IndexName);
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBIndexNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Open Query View Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    handleNodeCopy() {
        // Copy index info to clipboard
        const info = `${this.IndexType}: ${this.IndexName} - ${this.Keys}`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
    updateDescription() {
        this.description = this.Keys;
    }
}
exports.DynamoDBIndexNode = DynamoDBIndexNode;
//# sourceMappingURL=DynamoDBIndexNode.js.map