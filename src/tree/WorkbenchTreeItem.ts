import * as vscode from 'vscode';
import { TreeItemType } from './TreeItemType';

// Base Workbench tree item used across all AWS services.
// Generic params:
// TData: payload/metadata stored on the item
// TChild: type of children items (usually the subclass type itself)
export class WorkbenchTreeItem<TData = any, TChild = any> extends vscode.TreeItem {
    // Workbench metadata
    public readonly serviceId: string = '';
    public readonly itemData?: TData;
    public parentFolderId?: string;
    public isCustom: boolean = false;
    public isFolder: boolean = false;
    public compositeKey?: string;
    public displayName?: string;
    public awsName?: string;

    // Common service tree metadata
    public TreeItemType: TreeItemType | undefined;
    public Text: string = '';
    public Region?: string;
    public Parent?: TChild;
    public Children: TChild[] = [];

    // Common flags
    private _isFav: boolean = false;
    private _isHidden: boolean = false;
    private _isPinned: boolean = false;
    private _profileToShow: string = '';

    // Flag accessors used by service UIs
    public get IsFav(): boolean { return this._isFav; }
    public set IsFav(value: boolean) { this._isFav = value; this.setContextValue(); }

    public get IsHidden(): boolean { return this._isHidden; }
    public set IsHidden(value: boolean) { this._isHidden = value; this.setContextValue(); }

    public get IsPinned(): boolean { return this._isPinned; }
    public set IsPinned(value: boolean) { this._isPinned = value; this.setContextValue(); }

    public get ProfileToShow(): string { return this._profileToShow; }
    public set ProfileToShow(value: string) { this._profileToShow = value; this.setContextValue(); }

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        serviceId: string = '',
        contextValue?: string,
        itemData?: TData
    ) {
        super(label, collapsibleState);
        this.serviceId = serviceId;
        this.contextValue = contextValue;
        this.itemData = itemData;
        this.Text = label;
    }

    // Default no-op; subclasses override to append service-specific tags
    public setContextValue(): void {
        // Base context ensures visibility flags are reflected consistently
        let contextValue = '#Type:Base#';
        contextValue += this.IsFav ? 'Fav#' : '!Fav#';
        contextValue += this.IsHidden ? 'Hidden#' : '!Hidden#';
        contextValue += this.IsPinned ? 'Pinned#' : 'NotPinned#';
        contextValue += this.ProfileToShow ? 'Profile#' : 'NoProfile#';
        this.contextValue = contextValue;
    }

    // Default no-op; subclasses override to set icons based on TreeItemType and flags
    public refreshUI(): void {
        // Intentionally left blank in base
    }

    // Returns true if any descendant has IsFav flag set
    public IsAnyChidrenFav(): boolean {
        return this.IsAnyChidrenFavInternal(this as unknown as WorkbenchTreeItem<TData, TChild>);
    }

    private IsAnyChidrenFavInternal(node: WorkbenchTreeItem<TData, TChild>): boolean {
        for (const n of node.Children as any[]) {
            const child = n as WorkbenchTreeItem<any, any>;
            if (child.IsFav) { return true; }
            if ((child.Children?.length || 0) > 0) {
                if (this.IsAnyChidrenFavInternal(child)) { return true; }
            }
        }
        return false;
    }

    // Text filter match: checks label/Text/Region and any string-valued own properties
    public IsFilterStringMatch(FilterString: string): boolean {
        const q = FilterString ?? '';
        if (!q) { return true; }

        if ((this.label ?? '').toString().includes(q)) { return true; }
        if ((this.Text ?? '').includes(q)) { return true; }
        if ((this.Region ?? '').includes(q)) { return true; }
        if ((this.displayName ?? '').includes(q)) { return true; }
        if ((this.awsName ?? '').includes(q)) { return true; }

        // Generic scan of string fields on the item (covers service-specific ids like Arn/Name)
        try {
            for (const key of Object.keys(this)) {
                const val = (this as any)[key];
                if (typeof val === 'string' && val.includes(q)) { return true; }
            }
        } catch { /* ignore */ }

        if (this.IsFilterStringMatchAnyChildren(this as unknown as WorkbenchTreeItem<TData, TChild>, q)) { return true; }
        return false;
    }

    public IsFilterStringMatchAnyChildren(node: WorkbenchTreeItem<TData, TChild>, FilterString: string): boolean {
        const q = FilterString ?? '';
        if (!q) { return true; }
        for (const n of node.Children as any[]) {
            const child = n as WorkbenchTreeItem<any, any>;
            if ((child.Text ?? '').includes(q)) { return true; }
            if ((child.Region ?? '').includes(q)) { return true; }
            // Scan child string properties generically
            try {
                for (const key of Object.keys(child)) {
                    const val = (child as any)[key];
                    if (typeof val === 'string' && val.includes(q)) { return true; }
                }
            } catch { /* ignore */ }

            if ((child.Children?.length || 0) > 0) {
                if (this.IsFilterStringMatchAnyChildren(child, q)) { return true; }
            }
        }
        return false;
    }

    // Hide this node and all descendants
    public hideRecursive(): void {
        this.IsHidden = true;
        for (const n of this.Children as any[]) {
            const child = n as WorkbenchTreeItem<any, any>;
            child.hideRecursive();
        }
    }
}
