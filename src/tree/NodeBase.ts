import * as vscode from 'vscode';
import { TreeProvider } from './TreeProvider';
import { Session } from '../common/Session';

export abstract class NodeBase extends vscode.TreeItem {
   
    public static RootNodes: NodeBase[] = [];

    constructor(label: string, parent?: NodeBase) 
    {
        super(label);
        // Set parent and add this item to the parent's children
        this.Parent = parent || undefined;
        if (this.Parent) {
            this.Parent.Children.push(this);
            this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else {
            NodeBase.RootNodes.push(this);
        }
        this.SetContextValue();
        TreeProvider.Current.Refresh(this);
    }

    private _isFavorite: boolean = false;
    private _isHidden: boolean = false;
    public Parent: NodeBase | undefined = undefined;
    public Children: NodeBase[] = [];
    private _icon: string = "";
    private _awsProfile: string = "";
    public IsVisible: boolean = true;

    public SetVisible(): void {
        let result = true;
        if (Session.Current.IsShowOnlyFavorite && !this.IsFavorite) {
            result = false;
        }
        if (!Session.Current.IsShowHiddenNodes && this.IsHidden) {
            result = false;
        }
        if (Session.Current.FilterString.length > 0) {
            const filter = Session.Current.FilterString.toLowerCase();
            if (this.label &&!this.label.toString().toLowerCase().includes(filter)) {
                result = false;
            }
        }
        this.IsVisible = result;
        if(this.Children.length > 0){
            this.Children.forEach(child => {
                child.SetVisible();
            });
        }
        if (this.IsVisible && this.Parent) {
            this.Parent.IsVisible = true;
        }
    }

    public get AwsProfile(): string {
        return this._awsProfile;
    }

    public set AwsProfile(value: string) {
        this._awsProfile = value;
        this.SetContextValue();
    }

    public SetContextValue(): void {
        let context = "node";
        if (this.IsFavorite) { context += "#RemoveFav#"; }
        else { context += "#AddFav#"; }
        
        if (this.IsHidden) { context += "#UnHide#"; }
        else { context += "#Hide#"; }

        if (this.AwsProfile.length > 0) { context += "#ShowInAnyProfile#"; }
        else { context += "#ShowOnlyInThisProfile#"; }

        this.contextValue = context;
    }

    public get HasChildren(): boolean {
        return this.Children.length > 0;
    }

    public get IsHidden(): boolean {
        return this._isHidden;
    }

    public set IsHidden(value: boolean) {
        this._isHidden = value;
        this.SetContextValue();
        TreeProvider.Current.Refresh(this.Parent);
    }

    public get IsFavorite(): boolean {
        return this._isFavorite;
    }

    public set IsFavorite(value: boolean) {
        this._isFavorite = value;
        this.SetContextValue();
        TreeProvider.Current.Refresh(this.Parent);
    }

    public get Icon(): string {
        return this._icon;
    }

    public set Icon(value: string) {
        this._icon = value;
        this.iconPath = new vscode.ThemeIcon(this._icon);
    }

    public IsRunning: boolean = false;

    public Remove(): void {
        if (this.Parent) {
            const index = this.Parent.Children.indexOf(this);
            if (index > -1) {
                this.Parent.Children.splice(index, 1);
                if (!this.Parent.HasChildren) {
                    this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
            }
        } else {
            const index = NodeBase.RootNodes.indexOf(this);
            if (index > -1) {
                NodeBase.RootNodes.splice(index, 1);
            }
        }
        TreeProvider.Current.Refresh(this.Parent);
    }

}
