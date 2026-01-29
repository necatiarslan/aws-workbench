import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import * as ui from '../common/UI';
import { ServiceHub } from '../tree/ServiceHub';
import * as api from './API';

export class DynamoDBIndexNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "list-tree";
        
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    public IndexName: string = "";
    public IndexType: string = ""; // GSI or LSI
    public Keys: string = "";
    public KeySchema: Array<{ name: string; type: string; keyType: string }> = [];
    public Region: string = "";
    public TableName: string = "";
    public TableDetails: api.TableDetails | undefined = undefined;

    private async handleNodeRun(): Promise<void> {
        // Open Query View with this index pre-selected
        ui.logToOutput('DynamoDBIndexNode.handleNodeRun - Opening Query View with index: ' + this.IndexName);
        
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }

        if (this.IsWorking) { return; }

        this.StartWorking();

        try {
            if (this.TableDetails) {
                const { DynamoDBQueryView } = await import('./DynamoDBQueryView');
                DynamoDBQueryView.Render(
                    ServiceHub.Current.Context.extensionUri,
                    this.Region,
                    this.TableName,
                    this.TableDetails,
                    this.IndexName
                );
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBIndexNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Open Query View Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private handleNodeOpen(): void {
        // Copy index info to clipboard
        const info = `${this.IndexType}: ${this.IndexName} - ${this.Keys}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }

    public updateDescription(): void {
        this.description = this.Keys;
    }
}
