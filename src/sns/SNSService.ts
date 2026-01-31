import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { SNSTopicNode } from "./SNSTopicNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";
import { Session } from "../common/Session";

export class SNSService extends ServiceBase {

    public static Current: SNSService;

    constructor() {
        super();
        SNSService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        Telemetry.Current?.send("SNSService.Add");
        ui.logToOutput('SNSService.Add Started');

        // Prompt for region
        let selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion, 
            placeHolder: 'Region Name Exp: us-east-1'
        });
        if (!selectedRegion) { return; }

        // Optional: prompt for topic name filter
        let topicFilter = await vscode.window.showInputBox({
            placeHolder: 'Enter topic name filter (optional, leave empty for all topics)'
        });

        // Get topic list from AWS
        var resultTopics = await api.GetTopicList(selectedRegion, topicFilter);
        if (!resultTopics.isSuccessful) { return; }

        if (resultTopics.result.length === 0) {
            ui.showInfoMessage('No SNS topics found in region ' + selectedRegion);
            return;
        }

        // Let user select topics
        let selectedTopicList = await vscode.window.showQuickPick(resultTopics.result, {
            canPickMany: true, 
            placeHolder: 'Select SNS Topic(s)'
        });
        if (!selectedTopicList || selectedTopicList.length === 0) { return; }

        // Create topic nodes for each selected topic
        for (var selectedTopic of selectedTopicList) {
            const topicNode = new SNSTopicNode(selectedTopic, node);
            topicNode.Region = selectedRegion;
        }

        this.TreeSave();
        ui.logToOutput('SNSService.Add Completed - Added ' + selectedTopicList.length + ' topic(s)');
    }
}
