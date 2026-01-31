import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { SNSPublishGroupNode } from './SNSPublishGroupNode';
import { SNSSubscriptionsGroupNode } from './SNSSubscriptionsGroupNode';
import { SNSInfoGroupNode } from './SNSInfoGroupNode';
import { SNSTagsGroupNode } from './SNSTagsGroupNode';

export class SNSTopicNode extends NodeBase {

    constructor(TopicArn: string, parent?: NodeBase) {
        super(api.GetTopicNameFromArn(TopicArn), parent);
        this.Icon = "broadcast";
        this.TopicArn = TopicArn;
        this.TopicName = api.GetTopicNameFromArn(TopicArn);
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public TopicName: string = "";

    @Serialize()
    public TopicArn: string = "";

    @Serialize()
    public Region: string = "";

    @Serialize()
    public MessageFiles: { id: string; path: string }[] = [];

    private _attributes: Record<string, string> | undefined = undefined;

    public get Attributes(): Promise<Record<string, string> | undefined> {
        return this.getAttributes();
    }

    private async getAttributes(): Promise<Record<string, string> | undefined> {
        if (!this._attributes) {
            const response = await api.GetTopicAttributes(this.Region, this.TopicArn);
            if (response.isSuccessful) {
                this._attributes = response.result?.Attributes;
            } else {
                ui.logToOutput('api.GetTopicAttributes Error !!!', response.error);
                ui.showErrorMessage('Get Topic Attributes Error !!!', response.error);
            }
        }
        return this._attributes;
    }

    public async LoadDefaultChildren(): Promise<void> {
        new SNSPublishGroupNode("Publish", this);
        new SNSSubscriptionsGroupNode("Subscriptions", this);
        new SNSInfoGroupNode("Info", this);
        new SNSTagsGroupNode("Tags", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('SNSTopicNode.handleNodeInfo Started');

        this.StartWorking();

        try {

            const attributes = await this.Attributes;
            const info = {
                TopicArn: this.TopicArn,
                Region: this.Region,
                TopicName: this.TopicName,
                ...attributes
            };
            const jsonContent = JSON.stringify(info, null, 2);
            
            const document = await vscode.workspace.openTextDocument({
                                content: jsonContent,
                                language: 'json'
                            });
            await vscode.window.showTextDocument(document);
        } catch (error: any) {
            ui.logToOutput('SNSTopicNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Get Topic Info Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    public AddMessageFile(filePath: string): void {
        const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
        this.MessageFiles.push({ id, path: filePath });
        this.TreeSave();
    }

    public RemoveMessageFile(id: string): void {
        this.MessageFiles = this.MessageFiles.filter(f => f.id !== id);
        this.TreeSave();
    }
}

// Register the node for serialization
NodeRegistry.register('SNSTopicNode', SNSTopicNode);
