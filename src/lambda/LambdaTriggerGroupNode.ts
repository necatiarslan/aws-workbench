import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { LambdaTriggerFileNode } from './LambdaTriggerFileNode';
import * as ui from '../common/UI';
import { LambdaFunctionNode } from './LambdaFunctionNode';

export class LambdaTriggerGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "run-all";
        
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());

        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async handleNodeAdd(): Promise<void> {
        ui.logToOutput('LambdaTriggerGroupNode.NodeAdd Started');

        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        const files = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: { 'JSON files': ['json'] }
        });

        if (files && files.length > 0) {
            const filePath = files[0].fsPath;
            const fileName = ui.getFileNameWithExtension(filePath);
            const node = new LambdaTriggerFileNode(fileName, this);
            node.FilePath = filePath;
            lambdaNode.TriggerFiles.push({ id: node.id || '', path: filePath });
            this.TreeSave();
        }
    }

    public handleNodeRefresh(): void {
        ui.logToOutput('LambdaTriggerGroupNode.NodeRefresh Started');
        
        // Refresh children based on parent LambdaFunctionNode's TriggerFiles
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        this.Children = [];
        for (const triggerFile of lambdaNode.TriggerFiles) {
            const fileName = ui.getFileNameWithExtension(triggerFile.path);
            const node = new LambdaTriggerFileNode(fileName, this);
            node.FilePath = triggerFile.path;
        }
    }

    public handleNodeRun(): void {
        this.GetAwsResourceNode()?.NodeRun();
    }

}
