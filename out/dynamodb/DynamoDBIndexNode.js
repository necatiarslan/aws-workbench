"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBIndexNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const ui = require("../common/UI");
const ServiceHub_1 = require("../tree/ServiceHub");
class DynamoDBIndexNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "list-tree";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
    IndexName = "";
    IndexType = ""; // GSI or LSI
    Keys = "";
    KeySchema = [];
    Region = "";
    TableName = "";
    TableDetails = undefined;
    async handleNodeRun() {
        // Open Query View with this index pre-selected
        ui.logToOutput('DynamoDBIndexNode.handleNodeRun - Opening Query View with index: ' + this.IndexName);
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            if (this.TableDetails) {
                const { DynamoDBQueryView } = await Promise.resolve().then(() => require('./DynamoDBQueryView'));
                DynamoDBQueryView.Render(ServiceHub_1.ServiceHub.Current.Context.extensionUri, this.Region, this.TableName, this.TableDetails, this.IndexName);
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBIndexNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Open Query View Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    handleNodeOpen() {
        // Copy index info to clipboard
        const info = `${this.IndexType}: ${this.IndexName} - ${this.Keys}`;
        vscode.env.clipboard.writeText(info);
        ui.showInfoMessage(`Copied to clipboard: ${info}`);
    }
    updateDescription() {
        this.description = this.Keys;
    }
}
exports.DynamoDBIndexNode = DynamoDBIndexNode;
//# sourceMappingURL=DynamoDBIndexNode.js.map