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
exports.SQSService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = __importStar(require("vscode"));
const SQSQueueNode_1 = require("./SQSQueueNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const Session_1 = require("../common/Session");
class SQSService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        SQSService.Current = this;
    }
    async Add(node) {
        ui.logToOutput('SQSService.Add Started');
        let selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        // Optional filter for queue name
        let queueNameFilter = await vscode.window.showInputBox({
            value: '',
            placeHolder: 'Queue Name Filter (optional, leave empty for all)'
        });
        var resultQueues = await api.GetQueueList(selectedRegion, queueNameFilter || undefined);
        if (!resultQueues.isSuccessful) {
            return;
        }
        if (!resultQueues.result || resultQueues.result.length === 0) {
            ui.showInfoMessage('No SQS queues found in region ' + selectedRegion);
            return;
        }
        // Create display items with queue name extracted from URL
        const queueItems = resultQueues.result.map(url => ({
            label: api.GetQueueNameFromUrl(url),
            description: api.IsFifoQueue(url) ? 'FIFO' : 'Standard',
            detail: url
        }));
        let selectedQueueList = await vscode.window.showQuickPick(queueItems, {
            canPickMany: true,
            placeHolder: 'Select SQS Queue(s)'
        });
        if (!selectedQueueList || selectedQueueList.length === 0) {
            return;
        }
        for (var selectedQueue of selectedQueueList) {
            const queueNode = new SQSQueueNode_1.SQSQueueNode(selectedQueue.label, node);
            queueNode.QueueUrl = selectedQueue.detail;
            queueNode.Region = selectedRegion;
            queueNode.IsFifo = api.IsFifoQueue(selectedQueue.detail);
            // Fetch queue attributes to get ARN and DLQ info
            const attrsResult = await api.GetQueueAttributes(selectedRegion, selectedQueue.detail);
            if (attrsResult.isSuccessful && attrsResult.result) {
                queueNode.QueueArn = attrsResult.result.QueueArn || '';
                queueNode.DlqQueueArn = attrsResult.result.DlqQueueArn;
            }
        }
        this.TreeSave();
    }
}
exports.SQSService = SQSService;
//# sourceMappingURL=SQSService.js.map