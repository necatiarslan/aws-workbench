import { NodeBase } from '../tree/NodeBase';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { LambdaTriggerFileNode } from './LambdaTriggerFileNode';
import * as ui from '../common/UI';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import { TreeState } from '../tree/TreeState';

export class LambdaTriggerGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "run-all";

        this.ShouldBeSaved = false;
        this.EnableNodeAdd = true;
        this.EnableNodeRun = true;
        this.EnableNodeRefresh = true;
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

    public async NodeAdd(): Promise<void> {
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
            TreeState.save();
        }
    }

    public NodeRemove(): void {}

    public NodeRefresh(): void {
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

    public NodeView(): void {}

    public async NodeEdit(): Promise<void> {}

    public NodeRun(): void {
        this.GetAwsResourceNode()?.NodeRun();
    }

    public NodeStop(): void {}

    public NodeOpen(): void {}

    public NodeInfo(): void {}

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaTriggerGroupNode', LambdaTriggerGroupNode);