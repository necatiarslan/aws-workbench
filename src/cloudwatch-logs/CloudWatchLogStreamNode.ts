import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { Serialize } from '../common/serialization/Serialize';
import  { CloudWatchLogView } from './CloudWatchLogView';
import * as api from './API';
import * as ui from '../common/UI';

export class CloudWatchLogStreamNode extends NodeBase {

    constructor(LogStream: string, parent?: NodeBase) 
    {
        super(LogStream, parent);

        this.LogStream = LogStream;
        this.Icon = "cloudwatch-logstream";

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());

        this.SetContextValue();
    }

    @Serialize()
    public LogStream: string = "";

    @Serialize()
    public LogGroup: string = "";

    @Serialize()
    public Region: string = "";

    public handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    public handleNodeView(): void {
        CloudWatchLogView.Render(this.Region, this.LogGroup, this.LogStream);
    }

    public async handleNodeAdd(): Promise<void> {
        const message = await vscode.window.showInputBox({
            placeHolder: 'Enter a log event message',
            prompt: `Submit a log event to ${this.LogStream}`,
            ignoreFocusOut: true
        });

        if (message === undefined || message.trim().length === 0) {
            return;
        }

        try {
            this.StartWorking();

            const result = await api.PutLogEvent(this.Region, this.LogGroup, this.LogStream, message);
            if (!result.isSuccessful) {
                ui.showErrorMessage('Failed to submit log event', result.error as Error);
                return;
            }

            ui.showInfoMessage(`Log event submitted to ${this.LogStream}`);
        } catch (error: any) {
            ui.showErrorMessage('Failed to submit log event', error);
            ui.logToOutput('CloudWatchLogStreamNode.handleNodeAdd Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

}