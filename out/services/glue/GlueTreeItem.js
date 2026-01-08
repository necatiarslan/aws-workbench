"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
class GlueTreeItem extends vscode.TreeItem {
    label;
    TreeItemType;
    Region;
    ResourceName;
    collapsibleState;
    command;
    Parent;
    Payload;
    constructor(label, TreeItemType, Region, ResourceName, collapsibleState, command, Parent, Payload) {
        super(label, collapsibleState);
        this.label = label;
        this.TreeItemType = TreeItemType;
        this.Region = Region;
        this.ResourceName = ResourceName;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.Parent = Parent;
        this.Payload = Payload;
        // contextValue is set in setIcons
        this.setIcons();
    }
    IsFav = false;
    IsHidden = false;
    IsRunning = false;
    RunId;
    setIcons() {
        let iconName = "";
        switch (this.TreeItemType) {
            case TreeItemType_1.TreeItemType.GlueJob:
                iconName = "settings-gear";
                this.contextValue = "GlueJob";
                break;
            case TreeItemType_1.TreeItemType.GlueRunGroup:
                iconName = "history";
                this.contextValue = "GlueRunGroup";
                break;
            case TreeItemType_1.TreeItemType.GlueLogGroup:
                iconName = "output";
                this.contextValue = "GlueLogGroup";
                break;
            case TreeItemType_1.TreeItemType.GlueLogStream:
                iconName = "list-unordered";
                this.contextValue = "GlueLogStream";
                break;
            case TreeItemType_1.TreeItemType.GlueRun:
                iconName = "play";
                this.contextValue = "GlueRun";
                break;
            case TreeItemType_1.TreeItemType.GlueDetail:
                iconName = "info";
                this.contextValue = "GlueDetail";
                break;
            case TreeItemType_1.TreeItemType.GlueArguments:
                iconName = "list-selection";
                this.contextValue = "GlueArguments";
                break;
            case TreeItemType_1.TreeItemType.GlueInfo:
                iconName = "info";
                this.contextValue = "GlueInfo";
                break;
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon("sync~spin");
        }
        else {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }
    }
    refreshUI() {
        this.setIcons();
    }
}
exports.GlueTreeItem = GlueTreeItem;
//# sourceMappingURL=GlueTreeItem.js.map