import * as vscode from 'vscode';
import { TreeItemBase } from './TreeItemBase';

export class TreeProvider implements vscode.TreeDataProvider<TreeItemBase> {

    constructor(private context: vscode.ExtensionContext) 
    {
    
    }

    public getTreeItem(element: TreeItemBase): vscode.TreeItem | Promise<vscode.TreeItem> {
        return element;
    }

    public async getChildren(element?: TreeItemBase): Promise<TreeItemBase[]> {
        const result: TreeItemBase[] = [];
        return result;
    }


}
