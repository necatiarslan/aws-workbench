import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { TreeState } from '../tree/TreeState';
import { ServiceHub } from '../tree/ServiceHub';
import { DynamoDBKeysGroupNode } from './DynamoDBKeysGroupNode';
import { DynamoDBIndexesGroupNode } from './DynamoDBIndexesGroupNode';
import { DynamoDBCapacityNode } from './DynamoDBCapacityNode';
import { DynamoDBTagsGroupNode } from './DynamoDBTagsGroupNode';
import { DynamoDBInfoGroupNode } from './DynamoDBInfoGroupNode';

export class DynamoDBTableNode extends NodeBase {

    constructor(TableName: string, parent?: NodeBase) {
        super(TableName, parent);
        this.Icon = "dynamodb-table";
        this.TableName = TableName;
        
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;

        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        
        this.LoadDefaultChildren();
        this.SetContextValue();
    }

    @Serialize()
    public TableName: string = "";

    @Serialize()
    public Region: string = "";

    private _tableDetails: api.TableDetails | undefined = undefined;

    public get TableDetails(): Promise<api.TableDetails | undefined> {
        return this.getTableDetails();
    }

    private async getTableDetails(): Promise<api.TableDetails | undefined> {
        if (!this._tableDetails) {
            const response = await api.DescribeTable(this.Region, this.TableName);
            if (response.isSuccessful) {
                this._tableDetails = api.ExtractTableDetails(response.result);
            } else {
                ui.logToOutput('api.DescribeTable Error !!!', response.error);
                ui.showErrorMessage('Get Table Details Error !!!', response.error);
            }
        }
        return this._tableDetails;
    }

    public set TableDetails(value: api.TableDetails | undefined) {
        this._tableDetails = value;
    }

    public async LoadDefaultChildren(): Promise<void> {
        new DynamoDBKeysGroupNode("Keys", this);
        new DynamoDBIndexesGroupNode("Indexes", this);
        new DynamoDBCapacityNode("Capacity", this);
        new DynamoDBTagsGroupNode("Tags", this);
        new DynamoDBInfoGroupNode("Info", this);
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private async handleNodeRun(): Promise<void> {
        // Open Query View
        ui.logToOutput('DynamoDBTableNode.handleNodeRun - Opening Query View');
        
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }

        if (this.IsWorking) { return; }

        this.StartWorking();

        try {
            const details = await this.TableDetails;
            if (details) {
                const { DynamoDBQueryView } = await import('./DynamoDBQueryView');
                DynamoDBQueryView.Render(
                    ServiceHub.Current.Context.extensionUri,
                    this.Region,
                    this.TableName,
                    details
                );
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBTableNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Open Query View Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeView(): Promise<void> {
        // Open Scan View
        ui.logToOutput('DynamoDBTableNode.handleNodeView - Opening Scan View');
        
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }

        if (this.IsWorking) { return; }

        this.StartWorking();

        try {
            const details = await this.TableDetails;
            if (details) {
                const { DynamoDBScanView } = await import('./DynamoDBScanView');
                DynamoDBScanView.Render(
                    ServiceHub.Current.Context.extensionUri,
                    this.Region,
                    this.TableName,
                    details
                );
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBTableNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Open Scan View Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async handleNodeInfo(): Promise<void> {
        ui.logToOutput('DynamoDBTableNode.handleNodeInfo Started');

        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }

        if (this.IsWorking) { return; }

        this.StartWorking();

        try {
            const result = await api.DescribeTable(this.Region, this.TableName);
            if (result.isSuccessful) {
                const jsonContent = JSON.stringify(result.result, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document, { preview: true });
            }
        } catch (error: any) {
            ui.logToOutput('DynamoDBTableNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Show Table Info Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    public ClearTableDetailsCache(): void {
        this._tableDetails = undefined;
    }
}

// Register the node type for serialization
NodeRegistry.register('DynamoDBTableNode', DynamoDBTableNode);
