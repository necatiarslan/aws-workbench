"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchLogStreamNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const Serialize_1 = require("../common/serialization/Serialize");
const CloudWatchLogView_1 = require("./CloudWatchLogView");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
class CloudWatchLogStreamNode extends NodeBase_1.NodeBase {
    constructor(LogStream, parent) {
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
    LogStream = "";
    LogGroup = "";
    Region = "";
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    handleNodeView() {
        CloudWatchLogView_1.CloudWatchLogView.Render(this.Region, this.LogGroup, this.LogStream);
    }
    async handleNodeAdd() {
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
                ui.showErrorMessage('Failed to submit log event', result.error);
                return;
            }
            ui.showInfoMessage(`Log event submitted to ${this.LogStream}`);
        }
        catch (error) {
            ui.showErrorMessage('Failed to submit log event', error);
            ui.logToOutput('CloudWatchLogStreamNode.handleNodeAdd Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
}
exports.CloudWatchLogStreamNode = CloudWatchLogStreamNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogStreamNode.prototype, "LogStream", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogStreamNode.prototype, "LogGroup", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], CloudWatchLogStreamNode.prototype, "Region", void 0);
//# sourceMappingURL=CloudWatchLogStreamNode.js.map