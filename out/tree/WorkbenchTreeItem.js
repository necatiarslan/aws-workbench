"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchTreeItem = void 0;
const vscode = require("vscode");
// Base Workbench tree item used across all AWS services.
// Generic params:
// TData: payload/metadata stored on the item
// TChild: type of children items (usually the subclass type itself)
class WorkbenchTreeItem extends vscode.TreeItem {
    // Workbench metadata
    serviceId = '';
    itemData;
    parentFolderId;
    isCustom = false;
    isFolder = false;
    compositeKey;
    displayName;
    awsName;
    // Common service tree metadata
    TreeItemType;
    Text = '';
    Region;
    Parent;
    Children = [];
    // Common flags
    _isFav = false;
    _isHidden = false;
    _isPinned = false;
    _profileToShow = '';
    // Flag accessors used by service UIs
    get IsFav() { return this._isFav; }
    set IsFav(value) { this._isFav = value; this.setContextValue(); }
    get IsHidden() { return this._isHidden; }
    set IsHidden(value) { this._isHidden = value; this.setContextValue(); }
    get IsPinned() { return this._isPinned; }
    set IsPinned(value) { this._isPinned = value; this.setContextValue(); }
    get ProfileToShow() { return this._profileToShow; }
    set ProfileToShow(value) { this._profileToShow = value; this.setContextValue(); }
    constructor(label, collapsibleState = vscode.TreeItemCollapsibleState.None, serviceId = '', contextValue, itemData) {
        super(label, collapsibleState);
        this.serviceId = serviceId;
        this.contextValue = contextValue;
        this.itemData = itemData;
        this.Text = label;
    }
    // Default no-op; subclasses override to append service-specific tags
    setContextValue() {
        // Base context ensures visibility flags are reflected consistently
        let contextValue = '#Type:Base#';
        contextValue += this.IsFav ? 'Fav#' : '!Fav#';
        contextValue += this.IsHidden ? 'Hidden#' : '!Hidden#';
        contextValue += this.IsPinned ? 'Pinned#' : 'NotPinned#';
        contextValue += this.ProfileToShow ? 'Profile#' : 'NoProfile#';
        this.contextValue = contextValue;
    }
    // Default no-op; subclasses override to set icons based on TreeItemType and flags
    refreshUI() {
        // Intentionally left blank in base
    }
    // Returns true if any descendant has IsFav flag set
    IsAnyChidrenFav() {
        return this.IsAnyChidrenFavInternal(this);
    }
    IsAnyChidrenFavInternal(node) {
        for (const n of node.Children) {
            const child = n;
            if (child.IsFav) {
                return true;
            }
            if ((child.Children?.length || 0) > 0) {
                if (this.IsAnyChidrenFavInternal(child)) {
                    return true;
                }
            }
        }
        return false;
    }
    // Text filter match: checks label/Text/Region and any string-valued own properties
    IsFilterStringMatch(FilterString) {
        const q = FilterString ?? '';
        if (!q) {
            return true;
        }
        if ((this.label ?? '').toString().includes(q)) {
            return true;
        }
        if ((this.Text ?? '').includes(q)) {
            return true;
        }
        if ((this.Region ?? '').includes(q)) {
            return true;
        }
        if ((this.displayName ?? '').includes(q)) {
            return true;
        }
        if ((this.awsName ?? '').includes(q)) {
            return true;
        }
        // Generic scan of string fields on the item (covers service-specific ids like Arn/Name)
        try {
            for (const key of Object.keys(this)) {
                const val = this[key];
                if (typeof val === 'string' && val.includes(q)) {
                    return true;
                }
            }
        }
        catch { /* ignore */ }
        if (this.IsFilterStringMatchAnyChildren(this, q)) {
            return true;
        }
        return false;
    }
    IsFilterStringMatchAnyChildren(node, FilterString) {
        const q = FilterString ?? '';
        if (!q) {
            return true;
        }
        for (const n of node.Children) {
            const child = n;
            if ((child.Text ?? '').includes(q)) {
                return true;
            }
            if ((child.Region ?? '').includes(q)) {
                return true;
            }
            // Scan child string properties generically
            try {
                for (const key of Object.keys(child)) {
                    const val = child[key];
                    if (typeof val === 'string' && val.includes(q)) {
                        return true;
                    }
                }
            }
            catch { /* ignore */ }
            if ((child.Children?.length || 0) > 0) {
                if (this.IsFilterStringMatchAnyChildren(child, q)) {
                    return true;
                }
            }
        }
        return false;
    }
    // Hide this node and all descendants
    hideRecursive() {
        this.IsHidden = true;
        for (const n of this.Children) {
            const child = n;
            child.hideRecursive();
        }
    }
}
exports.WorkbenchTreeItem = WorkbenchTreeItem;
//# sourceMappingURL=WorkbenchTreeItem.js.map