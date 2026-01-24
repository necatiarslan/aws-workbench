import * as vscode from 'vscode';
import { TreeProvider } from './TreeProvider';
import { Session } from '../common/Session';
import { Serialize } from '../common/serialization/Serialize';
import { Telemetry } from '../common/Telemetry';
import * as ui from '../common/UI';
import { TreeState } from './TreeState';
import { EventEmitter } from '../common/EventEmitter';

export abstract class NodeBase extends vscode.TreeItem {
   
    public static RootNodes: NodeBase[] = [];

    // Event emitters for node operations
    protected OnNodeAdd: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeRemove: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeRefresh: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeView: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeEdit: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeRun: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeStop: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeOpen: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeInfo: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeLoaded: EventEmitter<void> = new EventEmitter<void>();

    constructor(label: string, parent?: NodeBase) 
    {
        super(label);        
        this.id = Date.now().toString() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        // Set parent and add this item to the parent's children
        this.Parent = parent || undefined;
        if (this.Parent) {
            this.Parent.Children.push(this);
            this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        } else {
            NodeBase.RootNodes.push(this);
        }

        TreeProvider.Current.Refresh(this);
    }

    public EnableNodeAdd: boolean = false;
    public EnableNodeRemove: boolean = false;
    public EnableNodeRefresh: boolean = false;
    public EnableNodeView: boolean = false;
    public EnableNodeEdit: boolean = false;
    public EnableNodeRun: boolean = false;
    public EnableNodeStop: boolean = false;
    public EnableNodeOpen: boolean = false;
    public EnableNodeInfo: boolean = false;
    public EnableNodeAlias: boolean = false;

    public ShouldBeSaved: boolean = true;
    

    @Serialize()
    private _isFavorite: boolean = false;

    @Serialize()
    private _isHidden: boolean = false;

    public Parent: NodeBase | undefined = undefined;
    public Children: NodeBase[] = [];

    @Serialize()
    private _icon: string = "";

    @Serialize()
    private _awsProfile: string = "";

    @Serialize()
    private _workspace: string = "";

    @Serialize()
    private _alias?: string;

    public IsVisible: boolean = true;

    public IsWorking: boolean = false;

    public IsAwsResourceNode: boolean = false;

    public GetAwsResourceNode(): NodeBase | undefined {
        if (this.IsAwsResourceNode) {
            return this;
        } else if (this.Parent) {
            return this.Parent.GetAwsResourceNode();
        } else {
            return undefined;
        }
    }

    public StartWorking(): void {
        this.IsWorking = true;  
        this.iconPath = new vscode.ThemeIcon("loading~spin");
        TreeProvider.Current.Refresh(this);
    }

    public StopWorking(): void {
        this.IsWorking = false;
        this.iconPath = new vscode.ThemeIcon(this._icon);
        TreeProvider.Current.Refresh(this);
    }

    public SetVisible(): void {
        let result = true;
        if (Session.Current.IsShowOnlyFavorite && !this.IsFavorite) {
            result = false;
        }
        if (!Session.Current.IsShowHiddenNodes && this.IsHidden) {
            result = false;
        }
        if(!Session.Current.IsShowHiddenNodes && this.AwsProfile.length > 0 && this.AwsProfile !== Session.Current.AwsProfile) {
            result = false;
        }
        if(!Session.Current.IsShowHiddenNodes && this.Workspace.length > 0 && this.Workspace !== vscode.workspace.name) {
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
        for (const child of this.Children) {
            child.AwsProfile = value;
        }
        if (value === "" && this.Parent) {
            this.Parent._awsProfile = value;
            this.Parent.SetContextValue();
        }
    }

    public get Workspace(): string {
        return this._workspace;
    }

    public set Workspace(value: string) {
        this._workspace = value;
        this.SetContextValue();
        for (const child of this.Children) {
            child.Workspace = value;
        }
        if (value === "" && this.Parent) {
            this.Parent._workspace = value;
            this.Parent.SetContextValue();
        }
    }

    public get Alias(): string | undefined {
        return this._alias;
    }

    public set Alias(value: string | undefined) {
        this._alias = value;
        if (value) {
            this.label = value;
        }
    }

    public SetContextValue(): void {
        let context = "node";
        context += "#AddToNode#Remove#"; 
        if (this.IsFavorite) { context += "#RemoveFav#"; }
        else { context += "#AddFav#"; }
        
        if (this.IsHidden) { context += "#UnHide#"; }
        else { context += "#Hide#"; }

        if (this.AwsProfile.length > 0) { context += "#ShowInAnyProfile#"; }
        else { context += "#ShowOnlyInThisProfile#"; }

        if (this.Workspace.length > 0) { context += "#ShowInAnyWorkspace#"; }
        else { context += "#ShowOnlyInThisWorkspace#"; }

        if (this.EnableNodeAdd) { context += "#NodeAdd#"; }
        if (this.EnableNodeRemove) { context += "#NodeRemove#"; }
        if (this.EnableNodeRefresh) { context += "#NodeRefresh#"; }
        if (this.EnableNodeView) { context += "#NodeView#"; }
        if (this.EnableNodeEdit) { context += "#NodeEdit#"; }
        if (this.EnableNodeRun) { context += "#NodeRun#"; }
        if (this.EnableNodeStop) { context += "#NodeStop#"; }
        if (this.EnableNodeOpen) { context += "#NodeOpen#"; }
        if (this.EnableNodeInfo) { context += "#NodeInfo#"; }
        if (this.EnableNodeAlias) { context += "#NodeAlias#"; }

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
        for (const child of this.Children) {
            child.IsHidden = value;
        }
        if (!value && this.Parent) {
            this.Parent._isHidden = value;
            this.Parent.SetContextValue();
        }
    }

    public get IsFavorite(): boolean {
        return this._isFavorite;
    }

    public set IsFavorite(value: boolean) {
        this._isFavorite = value;
        this.SetContextValue();
        TreeProvider.Current.Refresh(this.Parent);
        for (const child of this.Children) {
            child.IsFavorite = value;
        }
        if (value && this.Parent) {
            this.Parent._isFavorite = value;
            this.Parent.SetContextValue();
        }
    }

    public get Icon(): string {
        return this._icon;
    }

    public set Icon(value: string) {
        this._icon = value;
        this.iconPath = new vscode.ThemeIcon(this._icon);
    }

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

    /**
     * Finalize node after deserialization.
     * Sets up visual state and adds root nodes to RootNodes array.
     * Children are already linked during deserializeNode.
     */
    public finalizeDeserialization(): void {
        // Only add root nodes to RootNodes (children are already linked in deserializeNode)
        if (!this.Parent) {
            if (!NodeBase.RootNodes.includes(this)) {
                NodeBase.RootNodes.push(this);
            }
        }
        
        // Set collapsible state if has children
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }

        // Restore icon path from saved icon name
        if (this._icon) {
            this.iconPath = new vscode.ThemeIcon(this._icon);
        }

        this.SetContextValue();
        this.SetVisible();
        this.NodeLoaded();
        
        // Recursively finalize children
        for (const child of this.Children) {
            child.finalizeDeserialization();
        }
    }

    public async NodeAlias(): Promise<void> {
        Telemetry.Current?.send("NodeBase.NodeAlias");
        ui.logToOutput('NodeBase.NodeAlias Started');

        let alias = await vscode.window.showInputBox({ placeHolder: 'Alias' });
        if(alias===undefined){ return; }

        alias = alias.trim();
        this.Alias = alias;

        TreeProvider.Current.Refresh(this);
        TreeState.save();

    }

    // Event-based node operation methods - fire events that handlers are subscribed to
    public async NodeAdd(): Promise<void> {
        await this.OnNodeAdd.fire(undefined);
    }

    public async NodeRemove(): Promise<void> {
        await this.OnNodeRemove.fire(undefined);
    }

    public async NodeRefresh(): Promise<void> {
        await this.OnNodeRefresh.fire(undefined);
    }

    public async NodeView(): Promise<void> {
        await this.OnNodeView.fire(undefined);
    }

    public async NodeEdit(): Promise<void> {
        await this.OnNodeEdit.fire(undefined);
    }

    public async NodeRun(): Promise<void> {
        await this.OnNodeRun.fire(undefined);
    }

    public async NodeStop(): Promise<void> {
        await this.OnNodeStop.fire(undefined);
    }

    public async NodeOpen(): Promise<void> {
        await this.OnNodeOpen.fire(undefined);
    }

    public async NodeInfo(): Promise<void> {
        await this.OnNodeInfo.fire(undefined);
    }

    public async NodeLoaded(): Promise<void> {
        await this.OnNodeLoaded.fire(undefined);
    }
    
}
