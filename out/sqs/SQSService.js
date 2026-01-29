"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const SQSQueueNode_1 = require("./SQSQueueNode");
const TreeState_1 = require("../tree/TreeState");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class SQSService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        SQSService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("SQSService.Add");
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
        TreeState_1.TreeState.save();
    }
}
exports.SQSService = SQSService;
//# sourceMappingURL=SQSService.js.map