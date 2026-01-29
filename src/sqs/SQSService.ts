import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { SQSQueueNode } from "./SQSQueueNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class SQSService extends ServiceBase {   

    public static Current: SQSService;

    constructor() {
        super();
        SQSService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("SQSService.Add");
        ui.logToOutput('SQSService.Add Started');

        let selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if(!selectedRegion){ return; }

        // Optional filter for queue name
        let queueNameFilter = await vscode.window.showInputBox({
            value: '', 
            placeHolder: 'Queue Name Filter (optional, leave empty for all)'
        });

        var resultQueues = await api.GetQueueList(selectedRegion, queueNameFilter || undefined);
        if(!resultQueues.isSuccessful){ return; }

        if(!resultQueues.result || resultQueues.result.length === 0) {
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
        if(!selectedQueueList || selectedQueueList.length === 0){ return; }

        for(var selectedQueue of selectedQueueList)
        {
            const queueNode = new SQSQueueNode(selectedQueue.label, node);
            queueNode.QueueUrl = selectedQueue.detail;
            queueNode.Region = selectedRegion;
            queueNode.IsFifo = api.IsFifoQueue(selectedQueue.detail);
            
            // Fetch queue attributes to get ARN and DLQ info
            const attrsResult = await api.GetQueueAttributes(selectedRegion, selectedQueue.detail);
            if(attrsResult.isSuccessful && attrsResult.result) {
                queueNode.QueueArn = attrsResult.result.QueueArn || '';
                queueNode.DlqQueueArn = attrsResult.result.DlqQueueArn;
            }
        }

        TreeState.save();
    }
}
