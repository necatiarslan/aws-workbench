"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlueTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const TreeItemType_1 = require("../../tree/TreeItemType");
const WorkbenchTreeItem_1 = require("../../tree/WorkbenchTreeItem");
class GlueTreeItem extends WorkbenchTreeItem_1.WorkbenchTreeItem {
    label;
    TreeItemType;
    Region;
    ResourceName;
    collapsibleState;
    command;
    Payload;
    constructor(label, TreeItemType, Region, ResourceName, collapsibleState, command, parent, Payload) {
        super(label, collapsibleState);
        this.label = label;
        this.TreeItemType = TreeItemType;
        this.Region = Region;
        this.ResourceName = ResourceName;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.Payload = Payload;
        // wire parent if provided
        this.Parent = parent;
        // contextValue is set in setIcons
        this.setIcons();
    }
    // flag accessors inherited from WorkbenchTreeItem
    IsRunning = false;
    RunId;
    setContextValue() {
        let contextValue = "#Type:Glue#";
        contextValue += this.IsFav ? "Fav#" : "!Fav#";
        contextValue += this.IsHidden ? "Hidden#" : "!Hidden#";
        contextValue += this.ProfileToShow ? "Profile#" : "NoProfile#";
        switch (this.TreeItemType) {
            case TreeItemType_1.TreeItemType.GlueJob:
                contextValue += "GlueJob#";
                break;
            case TreeItemType_1.TreeItemType.GlueRunGroup:
                contextValue += "GlueRunGroup#";
                break;
            case TreeItemType_1.TreeItemType.GlueLogGroup:
                contextValue += "GlueLogGroup#";
                break;
            case TreeItemType_1.TreeItemType.GlueLogStream:
                contextValue += "GlueLogStream#";
                break;
            case TreeItemType_1.TreeItemType.GlueRun:
                contextValue += "GlueRun#";
                break;
            case TreeItemType_1.TreeItemType.GlueDetail:
                contextValue += "GlueDetail#";
                break;
            case TreeItemType_1.TreeItemType.GlueArguments:
                contextValue += "GlueArguments#";
                break;
            case TreeItemType_1.TreeItemType.GlueInfo:
                contextValue += "GlueInfo#";
                break;
        }
        this.contextValue = contextValue;
    }
    setIcons() {
        let iconName = "";
        switch (this.TreeItemType) {
            case TreeItemType_1.TreeItemType.GlueJob:
                iconName = "settings-gear";
                break;
            case TreeItemType_1.TreeItemType.GlueRunGroup:
                iconName = "history";
                break;
            case TreeItemType_1.TreeItemType.GlueLogGroup:
                iconName = "output";
                break;
            case TreeItemType_1.TreeItemType.GlueLogStream:
                iconName = "list-unordered";
                break;
            case TreeItemType_1.TreeItemType.GlueRun:
                iconName = "play";
                break;
            case TreeItemType_1.TreeItemType.GlueDetail:
                iconName = "info";
                break;
            case TreeItemType_1.TreeItemType.GlueArguments:
                iconName = "list-selection";
                break;
            case TreeItemType_1.TreeItemType.GlueInfo:
                iconName = "info";
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
        this.setContextValue();
    }
}
exports.GlueTreeItem = GlueTreeItem;
//# sourceMappingURL=GlueTreeItem.js.map