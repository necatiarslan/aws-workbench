"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBTableNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const ServiceHub_1 = require("../tree/ServiceHub");
const DynamoDBKeysGroupNode_1 = require("./DynamoDBKeysGroupNode");
const DynamoDBIndexesGroupNode_1 = require("./DynamoDBIndexesGroupNode");
const DynamoDBCapacityNode_1 = require("./DynamoDBCapacityNode");
const DynamoDBTagsGroupNode_1 = require("./DynamoDBTagsGroupNode");
const DynamoDBInfoGroupNode_1 = require("./DynamoDBInfoGroupNode");
class DynamoDBTableNode extends NodeBase_1.NodeBase {
    constructor(TableName, parent) {
        super(TableName, parent);
        this.Icon = "database";
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
    TableName = "";
    Region = "";
    _tableDetails = undefined;
    get TableDetails() {
        return this.getTableDetails();
    }
    async getTableDetails() {
        if (!this._tableDetails) {
            const response = await api.DescribeTable(this.Region, this.TableName);
            if (response.isSuccessful) {
                this._tableDetails = api.ExtractTableDetails(response.result);
            }
            else {
                ui.logToOutput('api.DescribeTable Error !!!', response.error);
                ui.showErrorMessage('Get Table Details Error !!!', response.error);
            }
        }
        return this._tableDetails;
    }
    set TableDetails(value) {
        this._tableDetails = value;
    }
    async LoadDefaultChildren() {
        new DynamoDBInfoGroupNode_1.DynamoDBInfoGroupNode("Info", this);
        new DynamoDBKeysGroupNode_1.DynamoDBKeysGroupNode("Keys", this);
        new DynamoDBIndexesGroupNode_1.DynamoDBIndexesGroupNode("Indexes", this);
        new DynamoDBCapacityNode_1.DynamoDBCapacityNode("Capacity", this);
        new DynamoDBTagsGroupNode_1.DynamoDBTagsGroupNode("Tags", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeRun() {
        // Open Query View
        ui.logToOutput('DynamoDBTableNode.handleNodeRun - Opening Query View');
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const details = await this.TableDetails;
            if (details) {
                const { DynamoDBQueryView } = await Promise.resolve().then(() => require('./DynamoDBQueryView'));
                DynamoDBQueryView.Render(ServiceHub_1.ServiceHub.Current.Context.extensionUri, this.Region, this.TableName, details);
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBTableNode.handleNodeRun Error !!!', error);
            ui.showErrorMessage('Open Query View Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeView() {
        // Open Scan View
        ui.logToOutput('DynamoDBTableNode.handleNodeView - Opening Scan View');
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const details = await this.TableDetails;
            if (details) {
                const { DynamoDBScanView } = await Promise.resolve().then(() => require('./DynamoDBScanView'));
                DynamoDBScanView.Render(ServiceHub_1.ServiceHub.Current.Context.extensionUri, this.Region, this.TableName, details);
            }
        }
        catch (error) {
            ui.logToOutput('DynamoDBTableNode.handleNodeView Error !!!', error);
            ui.showErrorMessage('Open Scan View Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async handleNodeInfo() {
        ui.logToOutput('DynamoDBTableNode.handleNodeInfo Started');
        if (!this.TableName || !this.Region) {
            ui.showWarningMessage('Table name or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
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
        }
        catch (error) {
            ui.logToOutput('DynamoDBTableNode.handleNodeInfo Error !!!', error);
            ui.showErrorMessage('Show Table Info Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    ClearTableDetailsCache() {
        this._tableDetails = undefined;
    }
}
exports.DynamoDBTableNode = DynamoDBTableNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], DynamoDBTableNode.prototype, "TableName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], DynamoDBTableNode.prototype, "Region", void 0);
// Register the node type for serialization
NodeRegistry_1.NodeRegistry.register('DynamoDBTableNode', DynamoDBTableNode);
//# sourceMappingURL=DynamoDBTableNode.js.map