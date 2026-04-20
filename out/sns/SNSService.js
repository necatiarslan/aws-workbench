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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = __importStar(require("vscode"));
const SNSTopicNode_1 = require("./SNSTopicNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const Session_1 = require("../common/Session");
class SNSService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        SNSService.Current = this;
    }
    async Add(node) {
        ui.logToOutput('SNSService.Add Started');
        // Prompt for region
        let selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) {
            return;
        }
        // Optional: prompt for topic name filter
        let topicFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter topic name filter (optional, leave empty for all topics)'
        });
        // Get topic list from AWS
        var resultTopics = await api.GetTopicList(selectedRegion, topicFilter);
        if (!resultTopics.isSuccessful) {
            return;
        }
        if (resultTopics.result.length === 0) {
            ui.showInfoMessage('No SNS topics found in region ' + selectedRegion);
            return;
        }
        // Let user select topics
        let selectedTopicList = await vscode.window.showQuickPick(resultTopics.result, {
            canPickMany: true,
            placeHolder: 'Select SNS Topic(s)'
        });
        if (!selectedTopicList || selectedTopicList.length === 0) {
            return;
        }
        // Create topic nodes for each selected topic
        for (var selectedTopic of selectedTopicList) {
            const topicNode = new SNSTopicNode_1.SNSTopicNode(selectedTopic, node);
            topicNode.Region = selectedRegion;
        }
        this.TreeSave();
        ui.logToOutput('SNSService.Add Completed - Added ' + selectedTopicList.length + ' topic(s)');
    }
}
exports.SNSService = SNSService;
//# sourceMappingURL=SNSService.js.map