import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueCodeFileNode } from './GlueCodeFileNode';
import { GlueCodeDownloadNode } from './GlueCodeDownloadNode';
import { GlueCodeUpdateNode } from './GlueCodeUpdateNode';
import { GlueCodeCompareNode } from './GlueCodeCompareNode';

export class GlueCodeGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "code";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        // Create child nodes
        new GlueCodeFileNode("Select File", this);
        new GlueCodeDownloadNode("Download", this);
        new GlueCodeUpdateNode("Update", this);
        new GlueCodeCompareNode("Compare", this);
        
        this.SetContextValue();
    }
}
