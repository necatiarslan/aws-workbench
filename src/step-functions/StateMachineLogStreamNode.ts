import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as cloudwatchApi from '../cloudwatch-logs/API';
import { StateMachineLogsGroupNode } from './StateMachineLogsGroupNode';

export class StateMachineLogStreamNode extends NodeBase {

    constructor(logStreamName: string, parent?: NodeBase, logGroupName?: string) 
    {
        super(logStreamName, parent);
        this.Icon = "file";
        this.LogStreamName = logStreamName;
        if(logGroupName) this.LogGroupName = logGroupName;

        this.OnNodeView.subscribe(() => this.handleNodeView());
        
        this.SetContextValue();
    }

    public LogStreamName: string = "";
    public LogGroupName: string = "";

    private async handleNodeView(): Promise<void> {
        const logsGroupNode = this.Parent as StateMachineLogsGroupNode;
        const stateMachineNode = logsGroupNode?.Parent as StateMachineNode;
        if(!stateMachineNode) return;

        this.StartWorking();
        try {
            const eventsResult = await cloudwatchApi.GetLogEvents(
                stateMachineNode.Region, 
                this.LogGroupName, 
                this.LogStreamName
            );

            if(eventsResult.isSuccessful && eventsResult.result) {
                const logMessages = eventsResult.result
                    .map(event => event.message)
                    .filter(msg => msg)
                    .join('\n');

                if(logMessages) {
                    const document = await vscode.workspace.openTextDocument({
                        content: logMessages,
                        language: 'log'
                    });
                    await vscode.window.showTextDocument(document);
                } else {
                    ui.showInfoMessage('No log events found');
                }
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineLogStreamNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Failed to view log stream', error);
        }
        this.StopWorking();
    }
}
