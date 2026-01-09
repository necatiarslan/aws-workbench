import * as vscode from 'vscode';
import { IService } from './IService';
import { WorkbenchTreeItem } from '../tree/WorkbenchTreeItem';
import { WorkbenchTreeProvider } from '../tree/WorkbenchTreeProvider';

export abstract class AbstractAwsService implements IService {
    public abstract serviceId: string;
    public abstract context: vscode.ExtensionContext;
    
    // Abstract methods that must be implemented by subclasses
    public abstract getRootNodes(): Promise<WorkbenchTreeItem[]>;
    public abstract getChildren(element?: WorkbenchTreeItem): Promise<WorkbenchTreeItem[]>;
    public abstract getTreeItem(element: WorkbenchTreeItem): vscode.TreeItem | Promise<vscode.TreeItem>;
    
    // Optional methods (default no-op or specific behavior)
    public async addResource(): Promise<WorkbenchTreeItem | undefined> { return undefined; }

    // Service-specific commands registration.
    // We override this to register common commands automatically or let subclasses do it.
    public abstract registerCommands(context: vscode.ExtensionContext, treeProvider: WorkbenchTreeProvider, treeView: vscode.TreeView<WorkbenchTreeItem>): void;

    // --- Common Logic for Hide/Fav/Profile ---

    protected hiddenIds: Set<string> = new Set();
    protected favoriteIds: Set<string> = new Set();
    protected profileScope: Map<string, string> = new Map(); // resourceId -> profileName

    // --- Persistence Keys ---
    protected get hiddenStorageKey(): string { return `${this.serviceId}.hiddenNodes`; }
    protected get favStorageKey(): string { return `${this.serviceId}.favoriteNodes`; }
    protected get profileStorageKey(): string { return `${this.serviceId}.profileScope`; }

    // --- State Management ---

    // --- Common UI State ---
    public isShowHiddenNodes: boolean = false;
    public isShowOnlyFavorite: boolean = false;

    // --- State Management ---
    protected loadBaseState() {
        // ... (existing)
        const hidden = this.context.globalState.get<string[]>(this.hiddenStorageKey, []);
        this.hiddenIds = new Set(hidden);

        const favs = this.context.globalState.get<string[]>(this.favStorageKey, []);
        this.favoriteIds = new Set(favs);

        const profiles = this.context.globalState.get<[string, string][]>(this.profileStorageKey, []);
        this.profileScope = new Map(profiles);
        
        // Load UI toggles
        this.isShowHiddenNodes = this.context.globalState.get<boolean>(`${this.serviceId}.isShowHiddenNodes`, false);
        this.isShowOnlyFavorite = this.context.globalState.get<boolean>(`${this.serviceId}.isShowOnlyFavorite`, false);
    }

    protected saveBaseState() {
        // ... (existing)
        this.context.globalState.update(this.hiddenStorageKey, Array.from(this.hiddenIds));
        this.context.globalState.update(this.favStorageKey, Array.from(this.favoriteIds));
        this.context.globalState.update(this.profileStorageKey, Array.from(this.profileScope.entries()));
        
        // Save UI toggles
        this.context.globalState.update(`${this.serviceId}.isShowHiddenNodes`, this.isShowHiddenNodes);
        this.context.globalState.update(`${this.serviceId}.isShowOnlyFavorite`, this.isShowOnlyFavorite);
    }
    
    // ...

    /**
     * Processes nodes to apply generic filters (Hidden, Fav) and context tags.
     * Services should call this at the end of getRootNodes and getChildren.
     */
    protected processNodes(nodes: WorkbenchTreeItem[]): WorkbenchTreeItem[] {
        // 1. Filter hidden
        const visible = this.isShowHiddenNodes ? nodes : nodes.filter(n => !this.isHidden(n));
        
        // 2. Mark Favs and add tags
        visible.forEach(n => {
            if (this.isFav(n)) {
                n.contextValue = (n.contextValue || '') + '#Fav#';
            } else {
                n.contextValue = (n.contextValue || '') + '#!Fav#';
            }

            // Tag as AwsResource to enable generic commands in package.json
            n.contextValue = (n.contextValue || '') + '#AwsResource#';
        });

        // 3. Filter "Show Only Fav" if enabled
        if (this.isShowOnlyFavorite) {
            return visible.filter(n => this.isFav(n));
        }

        return visible;
    }

    // --- Public Actions ---

    public toggleShowHiddenNodes() {
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.saveBaseState();
    }

    public toggleShowOnlyFavorite() {
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.saveBaseState();
    }

    // ... (rest of the file match)

    // --- Public Actions ---

    public hideResource(node: WorkbenchTreeItem) {
        const id = this.getResourceId(node);
        if (id) {
            this.hiddenIds.add(id);
            this.saveBaseState();
        }
    }

    public unhideResource(node: WorkbenchTreeItem) {
        const id = this.getResourceId(node);
        if (id) {
            this.hiddenIds.delete(id);
            this.saveBaseState();
        }
    }

    public addToFav(node: WorkbenchTreeItem) {
        const id = this.getResourceId(node);
        if (id) {
            this.favoriteIds.add(id);
            this.saveBaseState();
        }
    }

    public deleteFromFav(node: WorkbenchTreeItem) {
        const id = this.getResourceId(node);
        if (id) {
            this.favoriteIds.delete(id);
            this.saveBaseState();
        }
    }

    public showOnlyInProfile(node: WorkbenchTreeItem, profile: string) {
        const id = this.getResourceId(node);
        if (id) {
            this.profileScope.set(id, profile);
            this.saveBaseState();
        }
    }

    public showInAnyProfile(node: WorkbenchTreeItem) {
        const id = this.getResourceId(node);
        if (id) {
            this.profileScope.delete(id);
            this.saveBaseState();
        }
    }

    // --- Helper Methods ---

    protected getResourceId(node: WorkbenchTreeItem): string | undefined {
        // Ideally, the node.id or node.label is unique enough.
        // We prefer node.id if set, else label.
        // Or we might need to extract it from itemData.
        if (node.id) return node.id;
        if (typeof node.label === 'string') return node.label;
        if ((node.label as vscode.TreeItemLabel).label) return (node.label as vscode.TreeItemLabel).label;
        return undefined;
    }

    public isHidden(node: WorkbenchTreeItem): boolean {
        const id = this.getResourceId(node);
        return id ? this.hiddenIds.has(id) : false;
    }

    public isFav(node: WorkbenchTreeItem): boolean {
        const id = this.getResourceId(node);
        return id ? this.favoriteIds.has(id) : false;
    }

    /**
     * Helper to filter a list of nodes based on hidden state.
     * Subclasses should call this in getChildren/getRootNodes.
     */
    protected filterNodes(nodes: WorkbenchTreeItem[], showHidden: boolean): WorkbenchTreeItem[] {
        if (showHidden) return nodes;
        return nodes.filter(n => !this.isHidden(n));
    }
    
    /**
     * Helper to mark favorite nodes.
     * Subclasses should call this in getChildren/getRootNodes for visual indication (e.g. icon change or description).
     */
    protected markFavorites(nodes: WorkbenchTreeItem[]) {
        nodes.forEach(n => {
            if (this.isFav(n)) {
                // n.description = (n.description ? String(n.description) + ' ' : '') + '⭐';
                // Or set context value to allow "UnFav" command visibility
                n.contextValue = (n.contextValue || '') + '#Fav#';
            } else {
                n.contextValue = (n.contextValue || '') + '#!Fav#';
            }
        });
    }
}
