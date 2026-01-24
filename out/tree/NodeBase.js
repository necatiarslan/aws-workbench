"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeBase = void 0;
const vscode = require("vscode");
const TreeProvider_1 = require("./TreeProvider");
const Session_1 = require("../common/Session");
const Serialize_1 = require("../common/serialization/Serialize");
const Telemetry_1 = require("../common/Telemetry");
const ui = require("../common/UI");
const TreeState_1 = require("./TreeState");
const EventEmitter_1 = require("../common/EventEmitter");
class NodeBase extends vscode.TreeItem {
    static RootNodes = [];
    // Event emitters for node operations
    OnNodeAdd = new EventEmitter_1.EventEmitter();
    OnNodeRemove = new EventEmitter_1.EventEmitter();
    OnNodeRefresh = new EventEmitter_1.EventEmitter();
    OnNodeView = new EventEmitter_1.EventEmitter();
    OnNodeEdit = new EventEmitter_1.EventEmitter();
    OnNodeRun = new EventEmitter_1.EventEmitter();
    OnNodeStop = new EventEmitter_1.EventEmitter();
    OnNodeOpen = new EventEmitter_1.EventEmitter();
    OnNodeInfo = new EventEmitter_1.EventEmitter();
    OnNodeLoaded = new EventEmitter_1.EventEmitter();
    OnNodeLoadChildren = new EventEmitter_1.EventEmitter();
    constructor(label, parent) {
        super(label);
        this.id = Date.now().toString() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        // Set parent and add this item to the parent's children
        this.Parent = parent || undefined;
        if (this.Parent) {
            this.Parent.Children.push(this);
            this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        else {
            NodeBase.RootNodes.push(this);
        }
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    EnableNodeAlias = false;
    ShouldBeSaved = true;
    IsOnNodeLoadChildrenCalled = false;
    _isFavorite = false;
    _isHidden = false;
    Parent = undefined;
    Children = [];
    _icon = "";
    _awsProfile = "";
    _workspace = "";
    _alias;
    IsVisible = true;
    IsWorking = false;
    IsAwsResourceNode = false;
    GetAwsResourceNode() {
        if (this.IsAwsResourceNode) {
            return this;
        }
        else if (this.Parent) {
            return this.Parent.GetAwsResourceNode();
        }
        else {
            return undefined;
        }
    }
    StartWorking() {
        this.IsWorking = true;
        this.iconPath = new vscode.ThemeIcon("loading~spin");
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    StopWorking() {
        this.IsWorking = false;
        this.iconPath = new vscode.ThemeIcon(this._icon);
        TreeProvider_1.TreeProvider.Current.Refresh(this);
    }
    SetVisible() {
        let result = true;
        if (Session_1.Session.Current.IsShowOnlyFavorite && !this.IsFavorite) {
            result = false;
        }
        if (!Session_1.Session.Current.IsShowHiddenNodes && this.IsHidden) {
            result = false;
        }
        if (!Session_1.Session.Current.IsShowHiddenNodes && this.AwsProfile.length > 0 && this.AwsProfile !== Session_1.Session.Current.AwsProfile) {
            result = false;
        }
        if (!Session_1.Session.Current.IsShowHiddenNodes && this.Workspace.length > 0 && this.Workspace !== vscode.workspace.name) {
            result = false;
        }
        if (Session_1.Session.Current.FilterString.length > 0) {
            const filter = Session_1.Session.Current.FilterString.toLowerCase();
            if (this.label && !this.label.toString().toLowerCase().includes(filter)) {
                result = false;
            }
        }
        this.IsVisible = result;
        if (this.Children.length > 0) {
            this.Children.forEach(child => {
                child.SetVisible();
            });
        }
        if (this.IsVisible && this.Parent) {
            this.Parent.IsVisible = true;
        }
    }
    get AwsProfile() {
        return this._awsProfile;
    }
    set AwsProfile(value) {
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
    get Workspace() {
        return this._workspace;
    }
    set Workspace(value) {
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
    get Alias() {
        return this._alias;
    }
    set Alias(value) {
        this._alias = value;
        if (value) {
            this.label = value;
        }
    }
    SetContextValue() {
        let context = "node";
        context += "#AddToNode#Remove#";
        if (this.IsFavorite) {
            context += "#RemoveFav#";
        }
        else {
            context += "#AddFav#";
        }
        if (this.IsHidden) {
            context += "#UnHide#";
        }
        else {
            context += "#Hide#";
        }
        if (this.AwsProfile.length > 0) {
            context += "#ShowInAnyProfile#";
        }
        else {
            context += "#ShowOnlyInThisProfile#";
        }
        if (this.Workspace.length > 0) {
            context += "#ShowInAnyWorkspace#";
        }
        else {
            context += "#ShowOnlyInThisWorkspace#";
        }
        if (this.OnNodeAdd.hasListeners()) {
            context += "#NodeAdd#";
        }
        if (this.OnNodeRemove.hasListeners()) {
            context += "#NodeRemove#";
        }
        if (this.OnNodeRefresh.hasListeners()) {
            context += "#NodeRefresh#";
        }
        if (this.OnNodeView.hasListeners()) {
            context += "#NodeView#";
        }
        if (this.OnNodeEdit.hasListeners()) {
            context += "#NodeEdit#";
        }
        if (this.OnNodeRun.hasListeners()) {
            context += "#NodeRun#";
        }
        if (this.OnNodeStop.hasListeners()) {
            context += "#NodeStop#";
        }
        if (this.OnNodeOpen.hasListeners()) {
            context += "#NodeOpen#";
        }
        if (this.OnNodeInfo.hasListeners()) {
            context += "#NodeInfo#";
        }
        if (this.EnableNodeAlias) {
            context += "#NodeAlias#";
        }
        this.contextValue = context;
    }
    get HasChildren() {
        return this.Children.length > 0;
    }
    get IsHidden() {
        return this._isHidden;
    }
    set IsHidden(value) {
        this._isHidden = value;
        this.SetContextValue();
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
        for (const child of this.Children) {
            child.IsHidden = value;
        }
        if (!value && this.Parent) {
            this.Parent._isHidden = value;
            this.Parent.SetContextValue();
        }
    }
    get IsFavorite() {
        return this._isFavorite;
    }
    set IsFavorite(value) {
        this._isFavorite = value;
        this.SetContextValue();
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
        for (const child of this.Children) {
            child.IsFavorite = value;
        }
        if (value && this.Parent) {
            this.Parent._isFavorite = value;
            this.Parent.SetContextValue();
        }
    }
    get Icon() {
        return this._icon;
    }
    set Icon(value) {
        this._icon = value;
        this.iconPath = new vscode.ThemeIcon(this._icon);
    }
    Remove() {
        if (this.Parent) {
            const index = this.Parent.Children.indexOf(this);
            if (index > -1) {
                this.Parent.Children.splice(index, 1);
                if (!this.Parent.HasChildren) {
                    this.Parent.collapsibleState = vscode.TreeItemCollapsibleState.None;
                }
            }
        }
        else {
            const index = NodeBase.RootNodes.indexOf(this);
            if (index > -1) {
                NodeBase.RootNodes.splice(index, 1);
            }
        }
        TreeProvider_1.TreeProvider.Current.Refresh(this.Parent);
    }
    /**
     * Finalize node after deserialization.
     * Sets up visual state and adds root nodes to RootNodes array.
     * Children are already linked during deserializeNode.
     */
    finalizeDeserialization() {
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
    async NodeAlias() {
        Telemetry_1.Telemetry.Current?.send("NodeBase.NodeAlias");
        ui.logToOutput('NodeBase.NodeAlias Started');
        let alias = await vscode.window.showInputBox({ placeHolder: 'Alias' });
        if (alias === undefined) {
            return;
        }
        alias = alias.trim();
        this.Alias = alias;
        TreeProvider_1.TreeProvider.Current.Refresh(this);
        TreeState_1.TreeState.save();
    }
    // Event-based node operation methods - fire events that handlers are subscribed to
    async NodeAdd() {
        await this.OnNodeAdd.fire(undefined);
    }
    async NodeRemove() {
        await this.OnNodeRemove.fire(undefined);
    }
    async NodeRefresh() {
        await this.OnNodeRefresh.fire(undefined);
    }
    async NodeView() {
        await this.OnNodeView.fire(undefined);
    }
    async NodeEdit() {
        await this.OnNodeEdit.fire(undefined);
    }
    async NodeRun() {
        await this.OnNodeRun.fire(undefined);
    }
    async NodeStop() {
        await this.OnNodeStop.fire(undefined);
    }
    async NodeOpen() {
        await this.OnNodeOpen.fire(undefined);
    }
    async NodeInfo() {
        await this.OnNodeInfo.fire(undefined);
    }
    async NodeLoaded() {
        await this.OnNodeLoaded.fire(undefined);
    }
    async NodeLoadChildren() {
        await this.OnNodeLoadChildren.fire(undefined);
        this.IsOnNodeLoadChildrenCalled = true;
    }
}
exports.NodeBase = NodeBase;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Boolean)
], NodeBase.prototype, "_isFavorite", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Boolean)
], NodeBase.prototype, "_isHidden", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], NodeBase.prototype, "_icon", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], NodeBase.prototype, "_awsProfile", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], NodeBase.prototype, "_workspace", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], NodeBase.prototype, "_alias", void 0);
//# sourceMappingURL=NodeBase.js.map