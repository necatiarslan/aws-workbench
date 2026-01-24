import * as vscode from 'vscode';
import { NodeBase } from './NodeBase';

export class TreeProvider implements vscode.TreeDataProvider<NodeBase> {

    public static Current: TreeProvider;
	private _onDidChangeTreeData: vscode.EventEmitter<NodeBase | undefined | void> = new vscode.EventEmitter<NodeBase | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<NodeBase | undefined | void> = this._onDidChangeTreeData.event;

    constructor() {
        TreeProvider.Current = this;
    }

	public Refresh(node?: NodeBase): void {
		this._onDidChangeTreeData.fire(node?.Parent || undefined);
	}

    public getTreeItem(node: NodeBase): NodeBase {
        return node;
    }

    public async getChildren(node?: NodeBase): Promise<NodeBase[]> {
        if (node && !node.IsOnNodeLoadChildrenCalled) {
            await node?.NodeLoadChildren();
        }
        if (node && node.Children) {
            return node.Children.filter(child => child.IsVisible);
        }
        return NodeBase.RootNodes.filter(rootNode => rootNode.IsVisible);
    }


}
