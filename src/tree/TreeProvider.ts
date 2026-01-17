import * as vscode from 'vscode';
import { NodeBase } from './NodeBase';

export class TreeProvider implements vscode.TreeDataProvider<NodeBase> {

    constructor(private context: vscode.ExtensionContext) 
    {
    
    }

    public getTreeItem(node: NodeBase): vscode.TreeItem | Promise<vscode.TreeItem> {
        return node;
    }

    public async getChildren(node?: NodeBase): Promise<NodeBase[]> {
        const result: NodeBase[] = [];
        return result;
    }


}
