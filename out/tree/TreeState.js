"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeState = void 0;
const vscode = __importStar(require("vscode"));
const NodeBase_1 = require("./NodeBase");
const TreeSerializer_1 = require("../common/serialization/TreeSerializer");
const Session_1 = require("../common/Session");
const ui = __importStar(require("../common/UI"));
const fs = __importStar(require("fs"));
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
    static save(filePath) {
        // Clear any pending save
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }
        // Schedule debounced save
        this._saveTimeout = setTimeout(() => {
            this.saveImmediate(filePath);
        }, this.DEBOUNCE_MS);
    }
    /**
     * Immediately saves the tree state without debouncing.
     * Used during extension deactivation.
     */
    static saveImmediate(filePath) {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = undefined;
        }
        try {
            const rootNodes = NodeBase_1.NodeBase.RootNodes;
            const json = TreeSerializer_1.TreeSerializer.serializeTree(rootNodes);
            if (filePath) {
                fs.writeFileSync(filePath, json);
                ui.logToOutput(`TreeState: Exported ${rootNodes.length} root nodes`);
            }
            else {
                Session_1.Session.Current.Context.globalState.update(TREE_STATE_KEY, json);
                ui.logToOutput(`TreeState: Saved ${rootNodes.length} root nodes`);
            }
        }
        catch (error) {
            ui.logToOutput('TreeState: Failed to save tree:', error);
        }
    }
    /**
     * Loads the tree state from globalState and populates NodeBase.RootNodes.
     * Should be called during extension activation, after node types are registered.
     */
    static load(filePath) {
        try {
            let json = Session_1.Session.Current.Context.globalState.get(TREE_STATE_KEY);
            if (filePath) {
                json = fs.readFileSync(filePath, 'utf-8');
            }
            else {
                json = Session_1.Session.Current.Context.globalState.get(TREE_STATE_KEY);
            }
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
            // Optionally expand root nodes with children
            for (const rootNode of NodeBase_1.NodeBase.RootNodes) {
                if (rootNode.HasChildren) {
                    rootNode.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                }
            }
            ui.logToOutput(`TreeState: Loaded ${nodes.length} root nodes from saved state`);
        }
        catch (error) {
            ui.logToOutput('TreeState: Failed to load tree:', error);
            ui.showErrorMessage('Failed to load tree state', error);
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