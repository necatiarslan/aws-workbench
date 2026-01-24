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
exports.LambdaFunctionNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
const util_1 = require("util");
const TreeState_1 = require("../tree/TreeState");
const LambdaCodeGroupNode_1 = require("./LambdaCodeGroupNode");
const LambdaEnvGroupNode_1 = require("./LambdaEnvGroupNode");
const LambdaInfoGroupNode_1 = require("./LambdaInfoGroupNode");
const LambdaLogGroupNode_1 = require("./LambdaLogGroupNode");
const LambdaTagGroupNode_1 = require("./LambdaTagGroupNode");
const LambdaTriggerGroupNode_1 = require("./LambdaTriggerGroupNode");
const LambdaCodeFileNode_1 = require("./LambdaCodeFileNode");
const LambdaCodeUploadNode_1 = require("./LambdaCodeUploadNode");
const LambdaCodeDownloadNode_1 = require("./LambdaCodeDownloadNode");
class LambdaFunctionNode extends NodeBase_1.NodeBase {
    constructor(FunctionName, parent) {
        super(FunctionName, parent);
        this.Icon = "lambda-function";
        this.FunctionName = FunctionName;
        this.EnableNodeRemove = true;
        this.EnableNodeRun = true;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();
        this.LoadDefaultChildren();
    }
    FunctionName = "";
    Region = "";
    CodePath = "";
    async LoadDefaultChildren() {
        const code = new LambdaCodeGroupNode_1.LambdaCodeGroupNode("Code", this);
        new LambdaCodeFileNode_1.LambdaCodeFileNode("Select File", code);
        new LambdaCodeDownloadNode_1.LambdaCodeDownloadNode("Download", code);
        new LambdaCodeUploadNode_1.LambdaCodeUploadNode("Upload", code);
        new LambdaEnvGroupNode_1.LambdaEnvGroupNode("Env", this);
        new LambdaInfoGroupNode_1.LambdaInfoGroupNode("Info", this);
        new LambdaLogGroupNode_1.LambdaLogGroupNode("Logs", this);
        new LambdaTagGroupNode_1.LambdaTagGroupNode("Tags", this);
        new LambdaTriggerGroupNode_1.LambdaTriggerGroupNode("Triggers", this);
    }
    async NodeAdd() {
    }
    NodeRemove() {
        this.Remove();
        TreeState_1.TreeState.save();
    }
    NodeRefresh() {
    }
    NodeView() {
        //TODO: Implement Lambda function details viewing logic here
    }
    async NodeEdit() {
    }
    async NodeRun() {
        ui.logToOutput('LambdaFunctionNode.NodeRun Started');
        if (!this.FunctionName || !this.Region) {
            ui.showWarningMessage('Lambda function or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        // Prompt for payload JSON (optional)
        const payloadInput = await vscode.window.showInputBox({
            value: '',
            placeHolder: 'Enter Payload JSON or leave empty'
        });
        if (payloadInput === undefined) {
            return;
        }
        let payloadObj = {};
        if (payloadInput.trim().length > 0) {
            if (!ui.isJsonString(payloadInput)) {
                ui.showInfoMessage('Payload should be a valid JSON');
                return;
            }
            payloadObj = JSON.parse(payloadInput);
        }
        this.StartWorking();
        try {
            const result = await api.TriggerLambda(this.Region, this.FunctionName, payloadObj);
            if (!result.isSuccessful) {
                ui.logToOutput('api.TriggerLambda Error !!!', result.error);
                ui.showErrorMessage('Trigger Lambda Error !!!', result.error);
                return;
            }
            ui.logToOutput('api.TriggerLambda Success !!!');
            if (result.result?.$metadata?.requestId) {
                ui.logToOutput('RequestId: ' + result.result.$metadata.requestId);
            }
            const payloadBuffer = result.result?.Payload;
            if (payloadBuffer) {
                const payloadString = new util_1.TextDecoder('utf-8').decode(payloadBuffer);
                let prettyPayload = payloadString;
                try {
                    prettyPayload = JSON.stringify(JSON.parse(payloadString), null, 2);
                }
                catch {
                    // If not valid JSON, keep raw string
                }
                ui.logToOutput('api.TriggerLambda PayLoad \n' + prettyPayload);
            }
            ui.showInfoMessage('Lambda Triggered Successfully');
        }
        catch (error) {
            ui.logToOutput('LambdaFunctionNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Trigger Lambda Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    NodeStop() {
        //TODO: Implement Lambda function stop logic here
    }
    NodeOpen() {
    }
    NodeInfo() {
        //TODO: Implement Lambda function info display logic here
    }
}
exports.LambdaFunctionNode = LambdaFunctionNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaFunctionNode.prototype, "FunctionName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaFunctionNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], LambdaFunctionNode.prototype, "CodePath", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('LambdaFunctionNode', LambdaFunctionNode);
//# sourceMappingURL=LambdaFunctionNode.js.map