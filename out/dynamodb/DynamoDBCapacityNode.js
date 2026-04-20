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
exports.DynamoDBCapacityNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("../common/UI"));
class DynamoDBCapacityNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "dashboard";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.OnNodeCopy.subscribe(() => this.handleNodeCopy());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    BillingMode = "";
    ReadCapacity = 0;
    WriteCapacity = 0;
    async handleNodeRefresh() {
        ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh Started');
        const tableNode = this.Parent;
        if (!tableNode || !tableNode.TableName) {
            ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh - Parent table node not found');
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
            this.BillingMode = details.billingMode || 'PROVISIONED';
            this.ReadCapacity = details.readCapacity || 0;
            this.WriteCapacity = details.writeCapacity || 0;
            if (this.BillingMode === 'PAY_PER_REQUEST') {
                this.label = "Capacity: On-Demand";
            }
            else {
                this.label = `Capacity: RCU=${this.ReadCapacity}, WCU=${this.WriteCapacity}`;
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBCapacityNode.handleNodeRefresh Error !!!', error);
            ui.showErrorMessage('Load Capacity Error !!!', error);
        }
        finally {
            this.StopWorking();
            this.RefreshTree();
        }
    }
    handleNodeCopy() {
        const info = this.BillingMode === 'PAY_PER_REQUEST'
            ? 'Billing Mode: On-Demand (PAY_PER_REQUEST)'
            : `Billing Mode: Provisioned (RCU: ${this.ReadCapacity}, WCU: ${this.WriteCapacity})`;
        ui.CopyToClipboard(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
}
exports.DynamoDBCapacityNode = DynamoDBCapacityNode;
//# sourceMappingURL=DynamoDBCapacityNode.js.map