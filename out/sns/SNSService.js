"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNSService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = require("vscode");
const SNSTopicNode_1 = require("./SNSTopicNode");
const Telemetry_1 = require("../common/Telemetry");
const api = require("./API");
const ui = require("../common/UI");
const Session_1 = require("../common/Session");
class SNSService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        SNSService.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("SNSService.Add");
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