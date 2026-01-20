import * as vscode from 'vscode';
import { NodeBase } from './NodeBase';
import { TreeSerializer } from '../common/serialization/TreeSerializer';
import { Session } from '../common/Session';
import * as ui from '../common/UI';
import * as fs from 'fs';

/**
 * Key used for storing tree data in globalState.
 */
const TREE_STATE_KEY = 'TreeNodes';

/**
 * Handles saving and loading the tree node structure to/from VS Code globalState.
 * Includes debounced saving to prevent excessive writes during rapid changes.
 */
export class TreeState {
    private static _saveTimeout: ReturnType<typeof setTimeout> | undefined;
    private static readonly DEBOUNCE_MS = 500;

    /**
     * Saves the current tree state to globalState with debouncing.
     * Multiple calls within DEBOUNCE_MS will be collapsed into a single save.
     */
    public static save(filePath?: string): void {
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

    public static saveImmediate(filePath?: string): void {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = undefined;
        }

        try {
            const rootNodes = NodeBase.RootNodes;
            const json = TreeSerializer.serializeTree(rootNodes);
            
            if(filePath){
                fs.writeFileSync(filePath, json);
                ui.logToOutput(`TreeState: Exported ${rootNodes.length} root nodes`);
            }
            else{
                Session.Current.Context.globalState.update(TREE_STATE_KEY, json);
                ui.logToOutput(`TreeState: Saved ${rootNodes.length} root nodes`);
            }
        } catch (error) {
            ui.logToOutput('TreeState: Failed to save tree:', error as Error);
        }
    }

    /**
     * Loads the tree state from globalState and populates NodeBase.RootNodes.
     * Should be called during extension activation, after node types are registered.
     */
    public static load(filePath?: string): void {
        try {
            let json = Session.Current.Context.globalState.get<string>(TREE_STATE_KEY);
            if(filePath){
                json = fs.readFileSync(filePath, 'utf-8');
            }
            else{
                json = Session.Current.Context.globalState.get<string>(TREE_STATE_KEY);
            }
            
            if (!json) {
                ui.logToOutput('TreeState: No saved tree state found');
                return;
            }

            // Clear any existing nodes first
            NodeBase.RootNodes.length = 0;

            // Deserialize nodes
            const nodes = TreeSerializer.deserializeTree(json);
            
            // Finalize each root node (adds to RootNodes, rebuilds tree relationships)
            for (const node of nodes) {
                node.finalizeDeserialization();
            }
            
            ui.logToOutput(`TreeState: Loaded ${nodes.length} root nodes from saved state`);
        } catch (error) {
            ui.logToOutput('TreeState: Failed to load tree:', error as Error);
            ui.showErrorMessage('Failed to load tree state', error as Error);
        }
    }

    /**
     * Clears the saved tree state from globalState.
     */
    public static clear(): void {
        Session.Current.Context.globalState.update(TREE_STATE_KEY, undefined);
        ui.logToOutput('TreeState: Cleared saved tree state');
    }
}
