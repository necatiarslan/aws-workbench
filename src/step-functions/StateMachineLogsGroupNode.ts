import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { StateMachineNode } from './StateMachineNode';
import * as cloudwatchApi from '../cloudwatch-logs/API';
import { StateMachineLogStreamNode } from './StateMachineLogStreamNode';

export class StateMachineLogsGroupNode extends NodeBase {

    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "output";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
        this.SetContextValue();
    }

    private async handleLoadChildren(): Promise<void> {
        const parent = this.Parent as StateMachineNode;
        if(!parent) return;

        this.StartWorking();
        try {
            // Get log group name
            let logGroupName = parent.LogGroupName;
            if(!logGroupName) {
                const definition = await parent.GetDefinition();
                if(definition?.loggingConfiguration?.destinations) {
                    const logArn = definition.loggingConfiguration.destinations[0]?.cloudWatchLogsLogGroup?.logGroupArn;
                    if(logArn) {
                        const parts = logArn.split(':');
                        if(parts.length >= 7) {
                            logGroupName = parts[6];
                            parent.LogGroupName = logGroupName;
                        }
                    }
                }
            }

            if(!logGroupName) {
                ui.logToOutput('No log group configured for this state machine');
                this.StopWorking();
                return;
            }

            // List log streams
            const result = await cloudwatchApi.GetLogStreamList(parent.Region, logGroupName);
            if(result.isSuccessful && result.result) {
                // Clear existing children
                this.Children = [];

                // Add log stream nodes (limit to 20 most recent)
                const streams = result.result.slice(0, 20);
                for(const stream of streams) {
                    if(stream) {
                        new StateMachineLogStreamNode(stream, this, logGroupName);
                    }
                }

                if(streams.length === 0) {
                    ui.logToOutput('No log streams found');
                }
            }
        } catch (error: any) {
            ui.logToOutput('StateMachineLogsGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load log streams', error);
        }
        this.StopWorking();
    }

    private async handleNodeRefresh(): Promise<void> {
        this.Children = [];
        this.IsOnNodeLoadChildrenCalled = false;
        await this.handleLoadChildren();
    }

    private async handleNodeView(): Promise<void> {
        const parent = this.Parent as StateMachineNode;
        if(!parent) return;

        this.StartWorking();
        try {
            let logGroupName = parent.LogGroupName;
            if(!logGroupName) {
                const definition = await parent.GetDefinition();
                if(definition?.loggingConfiguration?.destinations) {
                    const logArn = definition.loggingConfiguration.destinations[0]?.cloudWatchLogsLogGroup?.logGroupArn;
                    if(logArn) {
                        const parts = logArn.split(':');
                        if(parts.length >= 7) {
                            logGroupName = parts[6];
                        }
                    }
                }
            }

            if(!logGroupName) {
                ui.showWarningMessage('No log group configured for this state machine');
                this.StopWorking();
                return;
            }

            // Get latest log stream
            const streamListResult = await cloudwatchApi.GetLogStreamList(parent.Region, logGroupName);
            if(!streamListResult.isSuccessful || !streamListResult.result || streamListResult.result.length === 0) {
                ui.showWarningMessage('No log streams found');
                this.StopWorking();
                return;
            }

            const latestStream = streamListResult.result[0];
            
            // Get log events
            const eventsResult = await cloudwatchApi.GetLogEvents(parent.Region, logGroupName, latestStream);
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
            ui.logToOutput('StateMachineLogsGroupNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Failed to view logs', error);
        }
        this.StopWorking();
    }
}
