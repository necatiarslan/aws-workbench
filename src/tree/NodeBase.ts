import * as vscode from 'vscode';
import { TreeProvider } from './TreeProvider';
import { Session } from '../common/Session';
import { Serialize } from '../common/serialization/Serialize';
import { Telemetry } from '../common/Telemetry';
import * as ui from '../common/UI';
import { TreeState } from './TreeState';
import { EventEmitter } from '../common/EventEmitter';
import { NodeRegistry } from '../common/serialization/NodeRegistry';

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
    protected OnNodeCopy: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeDeserialized: EventEmitter<void> = new EventEmitter<void>();
    protected OnNodeLoadChildren: EventEmitter<void> = new EventEmitter<void>();
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
            //inherit properties from parent
            this.AwsProfile = this.Parent.AwsProfile;
            this.Workspace = this.Parent.Workspace;
            this.IsHidden = this.Parent.IsHidden;
            this.IsFavorite = this.Parent.IsFavorite;
        } else {
            NodeBase.RootNodes.push(this);
        }

        this.RefreshTree()
    }
    
    public EnableNodeAlias: boolean = false;
    public IsOnNodeLoadChildrenCalled: boolean = false;
    public IsOnNodeLoadedCalled: boolean = false;

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

    @Serialize()
    private _customTooltip?: string;

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
        this.RefreshTree()
    }

    public StopWorking(): void {
        this.IsWorking = false;
        this.iconPath = new vscode.ThemeIcon(this._icon);
        this.RefreshTree()
    }

    public get IsSerializable(): boolean {
        return NodeRegistry.has(this.constructor.name);
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

    public get CustomTooltip(): string | undefined {
        return this._customTooltip;
    }

    public set CustomTooltip(value: string | undefined) {
        this._customTooltip = value;
        this.tooltip = value || (this.label as string);
    }

    public SetContextValue(): void {
        let context = "node";

        if (this.OnNodeAdd.hasListeners()) { context += "#NodeAdd#"; }
        if (this.OnNodeRemove.hasListeners()) { context += "#NodeRemove#"; }
        if (this.OnNodeRefresh.hasListeners()) { context += "#NodeRefresh#"; }
        if (this.OnNodeView.hasListeners()) { context += "#NodeView#"; }
        if (this.OnNodeEdit.hasListeners()) { context += "#NodeEdit#"; }
        if (this.OnNodeRun.hasListeners()) { context += "#NodeRun#"; }
        if (this.OnNodeStop.hasListeners()) { context += "#NodeStop#"; }
        if (this.OnNodeOpen.hasListeners()) { context += "#NodeOpen#"; }
        if (this.OnNodeInfo.hasListeners()) { context += "#NodeInfo#"; }
        if (this.OnNodeCopy.hasListeners()) { context += "#NodeCopy#"; }
        if (this.EnableNodeAlias) { context += "#NodeAlias#"; }

        if(this.IsSerializable){
            if (this.IsFavorite) { context += "#RemoveFav#"; }
            else { context += "#AddFav#"; }
            
            if (this.IsHidden) { context += "#UnHide#"; }
            else { context += "#Hide#"; }

            if (this.AwsProfile.length > 0) { context += "#ShowInAnyProfile#"; }
            else { context += "#ShowOnlyInThisProfile#"; }

            if (this.Workspace.length > 0) { context += "#ShowInAnyWorkspace#"; }
            else { context += "#ShowOnlyInThisWorkspace#"; }

            context += "#SetTooltip#";
            context += "#MoveUp#";
            context += "#MoveDown#";
            context += "#NodeMove#";
        }

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
        this.RefreshTree(this.Parent);
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
        this.RefreshTree(this.Parent);
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
        this.RefreshTree(this.Parent);
    }

    public MoveUp(): void {
        const siblings = this.Parent ? this.Parent.Children : NodeBase.RootNodes;
        const index = siblings.indexOf(this);
        if (index > 0) {
            // Swap with previous sibling
            [siblings[index - 1], siblings[index]] = [siblings[index], siblings[index - 1]];
            this.RefreshTree(this.Parent);
            this.TreeSave();
        }
    }

    public MoveDown(): void {
        const siblings = this.Parent ? this.Parent.Children : NodeBase.RootNodes;
        const index = siblings.indexOf(this);
        if (index >= 0 && index < siblings.length - 1) {
            // Swap with next sibling
            [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
            this.RefreshTree(this.Parent);
            this.TreeSave();
        }
    }

    public MoveToFolder(targetFolder: NodeBase): void {
        // Remove from current parent
        if (this.Parent) {
            const index = this.Parent.Children.indexOf(this);
            if (index > -1) {
                this.Parent.Children.splice(index, 1);
                if (!this.Parent.HasChildren) {
                    this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
            }
            this.RefreshTree(this.Parent);
        } else {
            const index = NodeBase.RootNodes.indexOf(this);
            if (index > -1) {
                NodeBase.RootNodes.splice(index, 1);
            }
        }

        // Add to target folder
        this.Parent = targetFolder;
        targetFolder.Children.push(this);
        targetFolder.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        this.RefreshTree(targetFolder);
        this.TreeSave();
    }

    public async SetCustomTooltip(): Promise<void> {
        const tooltip = await vscode.window.showInputBox({ 
            placeHolder: 'Enter custom tooltip (leave empty to reset)',
            value: this._customTooltip || ''
        });
        if (tooltip === undefined) { return; }
        
        this.CustomTooltip = tooltip.trim() || undefined;
        this.RefreshTree()
        this.TreeSave();
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
        this.NodeDeserialized();
        
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

        this.RefreshTree()
        this.TreeSave();

    }

    public RefreshTree(node?: NodeBase): void {
        if(node){
            TreeProvider.Current.Refresh(node);
            return;
        }
        TreeProvider.Current.Refresh(this);
    }

    public TreeSave(): void {
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
    
    public async NodeCopy(): Promise<void> {
        await this.OnNodeCopy.fire(undefined);
    }

    public async NodeDeserialized(): Promise<void> {
        await this.OnNodeDeserialized.fire(undefined);
    }

    public async NodeLoadChildren(): Promise<void> {
        await this.OnNodeLoadChildren.fire(undefined);
        this.IsOnNodeLoadChildrenCalled = true;
    }

    public async NodeLoaded(): Promise<void> {
        await this.OnNodeLoaded.fire(undefined);
        this.IsOnNodeLoadedCalled = true;
    }
    
}
