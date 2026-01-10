"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractAwsService = void 0;
class AbstractAwsService {
    // Optional methods (default no-op or specific behavior)
    async addResource(folderId) { return undefined; }
    // --- Common Logic for Hide/Fav/Profile ---
    hiddenIds = new Set();
    favoriteIds = new Set();
    profileScope = new Map(); // resourceId -> profileName
    customResources = new Map(); // compositeKey -> CustomResource
    // --- Persistence Keys ---
    get hiddenStorageKey() { return `${this.serviceId}.hiddenNodes`; }
    get favStorageKey() { return `${this.serviceId}.favoriteNodes`; }
    get profileStorageKey() { return `${this.serviceId}.profileScope`; }
    get customResourcesStorageKey() { return `${this.serviceId}.customResources`; }
    // --- Common UI State ---
    isShowHiddenNodes = false;
    isShowOnlyFavorite = false;
    // --- State Management ---
    loadBaseState() {
        // Load hidden and favorite nodes
        const hidden = this.context.globalState.get(this.hiddenStorageKey, []);
        this.hiddenIds = new Set(hidden);
        const favs = this.context.globalState.get(this.favStorageKey, []);
        this.favoriteIds = new Set(favs);
        const profiles = this.context.globalState.get(this.profileStorageKey, []);
        this.profileScope = new Map(profiles);
        // Load UI toggles
        this.isShowHiddenNodes = this.context.globalState.get(`${this.serviceId}.isShowHiddenNodes`, false);
        this.isShowOnlyFavorite = this.context.globalState.get(`${this.serviceId}.isShowOnlyFavorite`, false);
    }
    saveBaseState() {
        // ... (existing)
        this.context.globalState.update(this.hiddenStorageKey, Array.from(this.hiddenIds));
        this.context.globalState.update(this.favStorageKey, Array.from(this.favoriteIds));
        this.context.globalState.update(this.profileStorageKey, Array.from(this.profileScope.entries()));
        // Save UI toggles
        this.context.globalState.update(`${this.serviceId}.isShowHiddenNodes`, this.isShowHiddenNodes);
        this.context.globalState.update(`${this.serviceId}.isShowOnlyFavorite`, this.isShowOnlyFavorite);
    }
    // --- Custom Resources Management ---
    async loadCustomResources() {
        try {
            const resourceArray = this.context.globalState.get(this.customResourcesStorageKey, []);
            this.customResources = new Map(resourceArray);
            console.log(`[${this.serviceId}] Loaded ${this.customResources.size} custom resources`);
        }
        catch (error) {
            console.error(`[${this.serviceId}] Failed to load custom resources:`, error);
        }
    }
    async saveCustomResources() {
        try {
            const resourceArray = Array.from(this.customResources.entries());
            await this.context.globalState.update(this.customResourcesStorageKey, resourceArray);
        }
        catch (error) {
            console.error(`[${this.serviceId}] Failed to save custom resources:`, error);
        }
    }
    async addCustomResource(compositeKey, displayName, awsName, resourceData, folderId) {
        const resource = {
            compositeKey,
            displayName,
            awsName,
            folderId: folderId || null,
            resourceData,
            createdAt: Date.now(),
        };
        this.customResources.set(compositeKey, resource);
        await this.saveCustomResources();
        console.log(`[${this.serviceId}] Added custom resource: ${compositeKey}`);
    }
    async removeCustomResource(compositeKey) {
        if (this.customResources.has(compositeKey)) {
            this.customResources.delete(compositeKey);
            await this.saveCustomResources();
            console.log(`[${this.serviceId}] Removed custom resource: ${compositeKey}`);
        }
    }
    getCustomResourcesByFolder(folderId) {
        return Array.from(this.customResources.values()).filter(r => r.folderId === folderId);
    }
    getDisplayName(resource) {
        if (resource.displayName && resource.displayName !== resource.awsName) {
            return `${resource.displayName} → ${resource.awsName}`;
        }
        return resource.awsName;
    }
    // --- Helper to count resources in folders (for cascade delete confirmation) ---
    countResourcesInFolders(folderIds) {
        let count = 0;
        for (const resource of this.customResources.values()) {
            if (resource.folderId && folderIds.includes(resource.folderId)) {
                count++;
            }
        }
        return count;
    }
    // ...
    /**
     * Processes nodes to apply generic filters (Hidden, Fav) and context tags.
     * Services should call this at the end of getRootNodes and getChildren.
     */
    processNodes(nodes) {
        // 1. Filter hidden
        const visible = this.isShowHiddenNodes ? nodes : nodes.filter(n => !this.isHidden(n));
        // 2. Mark Favs and add tags
        visible.forEach(n => {
            if (this.isFav(n)) {
                n.contextValue = (n.contextValue || '') + '#Fav#';
            }
            else {
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
    toggleShowHiddenNodes() {
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.saveBaseState();
    }
    toggleShowOnlyFavorite() {
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.saveBaseState();
    }
    // ... (rest of the file match)
    // --- Public Actions ---
    hideResource(node) {
        const id = this.getResourceId(node);
        if (id) {
            this.hiddenIds.add(id);
            this.saveBaseState();
        }
    }
    unhideResource(node) {
        const id = this.getResourceId(node);
        if (id) {
            this.hiddenIds.delete(id);
            this.saveBaseState();
        }
    }
    addToFav(node) {
        const id = this.getResourceId(node);
        if (id) {
            this.favoriteIds.add(id);
            this.saveBaseState();
        }
    }
    deleteFromFav(node) {
        const id = this.getResourceId(node);
        if (id) {
            this.favoriteIds.delete(id);
            this.saveBaseState();
        }
    }
    showOnlyInProfile(node, profile) {
        const id = this.getResourceId(node);
        if (id) {
            this.profileScope.set(id, profile);
            this.saveBaseState();
        }
    }
    showInAnyProfile(node) {
        const id = this.getResourceId(node);
        if (id) {
            this.profileScope.delete(id);
            this.saveBaseState();
        }
    }
    // --- Helper Methods ---
    getResourceId(node) {
        // Ideally, the node.id or node.label is unique enough.
        // We prefer node.id if set, else label.
        // Or we might need to extract it from itemData.
        if (node.id)
            return node.id;
        if (typeof node.label === 'string')
            return node.label;
        if (node.label.label)
            return node.label.label;
        return undefined;
    }
    isHidden(node) {
        const id = this.getResourceId(node);
        return id ? this.hiddenIds.has(id) : false;
    }
    isFav(node) {
        const id = this.getResourceId(node);
        return id ? this.favoriteIds.has(id) : false;
    }
    /**
     * Helper to filter a list of nodes based on hidden state.
     * Subclasses should call this in getChildren/getRootNodes.
     */
    filterNodes(nodes, showHidden) {
        if (showHidden)
            return nodes;
        return nodes.filter(n => !this.isHidden(n));
    }
    /**
     * Helper to mark favorite nodes.
     * Subclasses should call this in getChildren/getRootNodes for visual indication (e.g. icon change or description).
     */
    markFavorites(nodes) {
        nodes.forEach(n => {
            if (this.isFav(n)) {
                // n.description = (n.description ? String(n.description) + ' ' : '') + '⭐';
                // Or set context value to allow "UnFav" command visibility
                n.contextValue = (n.contextValue || '') + '#Fav#';
            }
            else {
                n.contextValue = (n.contextValue || '') + '#!Fav#';
            }
        });
    }
}
exports.AbstractAwsService = AbstractAwsService;
//# sourceMappingURL=AbstractAwsService.js.map