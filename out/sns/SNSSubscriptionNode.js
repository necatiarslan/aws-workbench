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
exports.SNSSubscriptionNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
class SNSSubscriptionNode extends NodeBase_1.NodeBase {
    Protocol = "";
    Endpoint = "";
    SubscriptionArn = "";
    constructor(protocol, endpoint, subscriptionArn, parent) {
        // Build label with pending status indicator
        const isPending = api.IsSubscriptionPending(subscriptionArn);
        const label = isPending
            ? `${protocol.toUpperCase()}: ${endpoint} (pending)`
            : `${protocol.toUpperCase()}: ${endpoint}`;
        super(label, parent);
        this.Protocol = protocol;
        this.Endpoint = endpoint;
        this.SubscriptionArn = subscriptionArn;
        // Set icon based on protocol
        this.Icon = this.getIconForProtocol(protocol);
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.tooltip = `Protocol: ${protocol}\nEndpoint: ${endpoint}\nARN: ${subscriptionArn}`;
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.SetContextValue();
    }
    getIconForProtocol(protocol) {
        switch (protocol.toLowerCase()) {
            case 'email':
            case 'email-json':
                return 'mail';
            case 'sqs':
                return 'inbox';
            case 'lambda':
                return 'symbol-function';
            case 'http':
            case 'https':
                return 'globe';
            default:
                return 'person';
        }
    }
    get IsPending() {
        return api.IsSubscriptionPending(this.SubscriptionArn);
    }
    async handleNodeRemove() {
        ui.logToOutput('SNSSubscriptionNode.handleNodeRemove Started');
        // If pending, just remove from tree without calling API
        if (this.IsPending) {
            ui.showInfoMessage('Pending subscription removed from view. It will be deleted automatically if not confirmed.');
            this.Remove();
            this.RefreshTree(this.Parent);
            return;
        }
        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(`Are you sure you want to unsubscribe "${this.Protocol}: ${this.Endpoint}"?`, { modal: true }, 'Yes', 'No');
        if (confirm !== 'Yes') {
            return;
        }
        const topicNode = this.GetAwsResourceNode();
        if (!topicNode || !topicNode.Region) {
            ui.showWarningMessage('Region is not set.');
            return;
        }
        this.StartWorking();
        try {
            const result = await api.Unsubscribe(topicNode.Region, this.SubscriptionArn);
            if (!result.isSuccessful) {
                ui.logToOutput('api.Unsubscribe Error !!!', result.error);
                ui.showErrorMessage('Unsubscribe Error !!!', result.error);
                return;
            }
            ui.logToOutput('api.Unsubscribe Success');
            ui.showInfoMessage('Subscription removed successfully.');
            this.Remove();
            this.RefreshTree(this.Parent);
        }
        catch (error) {
            ui.logToOutput('SNSSubscriptionNode.handleNodeRemove Error !!!', error);
            ui.showErrorMessage('Unsubscribe Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeInfo() {
        ui.logToOutput('SNSSubscriptionNode.handleNodeInfo Started');
        const info = {
            Protocol: this.Protocol,
            Endpoint: this.Endpoint,
            SubscriptionArn: this.SubscriptionArn,
            Status: this.IsPending ? 'Pending Confirmation' : 'Confirmed'
        };
        ui.showOutputMessage(JSON.stringify(info, null, 2), 'Subscription info printed to OUTPUT');
    }
}
exports.SNSSubscriptionNode = SNSSubscriptionNode;
//# sourceMappingURL=SNSSubscriptionNode.js.map