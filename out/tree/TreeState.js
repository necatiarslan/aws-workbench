"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeState = void 0;
const NodeBase_1 = require("./NodeBase");
const TreeSerializer_1 = require("../common/serialization/TreeSerializer");
const Session_1 = require("../common/Session");
const ui = require("../common/UI");
/**
 * Key used for storing tree data in globalState.
 */
const TREE_STATE_KEY = 'TreeNodes';
/**
 * Handles saving and loading the tree node structure to/from VS Code globalState.
 * Includes debounced saving to prevent excessive writes during rapid changes.
 */
class TreeState {
    static _saveTimeout;
    static DEBOUNCE_MS = 500;
    /**
     * Saves the current tree state to globalState with debouncing.
     * Multiple calls within DEBOUNCE_MS will be collapsed into a single save.
     */
    static save() {
        // Clear any pending save
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }
        // Schedule debounced save
        this._saveTimeout = setTimeout(() => {
            this.saveImmediate();
        }, this.DEBOUNCE_MS);
    }
    /**
     * Immediately saves the tree state without debouncing.
     * Used during extension deactivation.
     */
    static saveImmediate() {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = undefined;
        }
        try {
            const rootNodes = NodeBase_1.NodeBase.RootNodes;
            const json = TreeSerializer_1.TreeSerializer.serializeTree(rootNodes);
            Session_1.Session.Current.Context.globalState.update(TREE_STATE_KEY, json);
            //ui.logToOutput(json)
            ui.logToOutput(`TreeState: Saved ${rootNodes.length} root nodes`);
        }
        catch (error) {
            ui.logToOutput('TreeState: Failed to save tree:', error);
        }
    }
    /**
     * Loads the tree state from globalState and populates NodeBase.RootNodes.
     * Should be called during extension activation, after node types are registered.
     */
    static load() {
        try {
            const json = Session_1.Session.Current.Context.globalState.get(TREE_STATE_KEY);
            if (!json) {
                ui.logToOutput('TreeState: No saved tree state found');
                return;
            }
            // Clear any existing nodes first
            NodeBase_1.NodeBase.RootNodes.length = 0;
            // Deserialize nodes
            const nodes = TreeSerializer_1.TreeSerializer.deserializeTree(json);
            // Finalize each root node (adds to RootNodes, rebuilds tree relationships)
            for (const node of nodes) {
                node.finalizeDeserialization();
            }
            ui.logToOutput(`TreeState: Loaded ${nodes.length} root nodes from saved state`);
        }
        catch (error) {
            ui.logToOutput('TreeState: Failed to load tree:', error);
        }
    }
    /**
     * Clears the saved tree state from globalState.
     */
    static clear() {
        Session_1.Session.Current.Context.globalState.update(TREE_STATE_KEY, undefined);
        ui.logToOutput('TreeState: Cleared saved tree state');
    }
}
exports.TreeState = TreeState;
//# sourceMappingURL=TreeState.js.map