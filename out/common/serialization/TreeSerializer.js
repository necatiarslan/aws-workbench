"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeSerializer = void 0;
const NodeRegistry_1 = require("./NodeRegistry");
const Serialize_1 = require("./Serialize");
const ui = require("../UI");
/**
 * Handles serialization and deserialization of the node tree.
 * Converts between NodeBase instances and JSON-compatible structures.
 */
class TreeSerializer {
    static CURRENT_VERSION = 1;
    /**
     * Serializes a single node and its children recursively.
     * Only properties marked with @Serialize() are included.
     */
    static serializeNode(node) {
        const typeName = NodeRegistry_1.NodeRegistry.getTypeName(node);
        const serializableProps = (0, Serialize_1.getSerializableProperties)(node);
        // Extract serializable properties
        const properties = {};
        for (const propKey of serializableProps) {
            const key = String(propKey);
            // Access both public and private properties
            const value = node[key];
            // Only serialize defined, serializable values
            if (value !== undefined && this.isSerializable(value)) {
                properties[key] = value;
            }
        }
        // Recursively serialize children
        const children = node.Children.filter(child => child.ShouldBeSaved).map(child => this.serializeNode(child));
        return {
            _type: typeName,
            _id: node.id || '',
            _label: String(node.label || ''),
            _properties: properties,
            _children: children
        };
    }
    /**
     * Deserializes a node and its children recursively.
     * Uses NodeRegistry to create correct class instances.
     */
    static deserializeNode(data, parent) {
        const Constructor = NodeRegistry_1.NodeRegistry.get(data._type);
        if (!Constructor) {
            ui.logToOutput(`TreeSerializer: Unknown node type "${data._type}", skipping`);
            return undefined;
        }
        try {
            // Create node with minimal constructor args
            // Most nodes take (label, parent?) as constructor args
            const node = new Constructor(data._label, parent);
            // Override the auto-generated ID with the saved one
            if (data._id) {
                node.id = data._id;
            }
            // Restore serialized properties
            for (const [key, value] of Object.entries(data._properties)) {
                if (key in node || this.isPrivateProperty(key, node)) {
                    node[key] = value;
                }
            }
            // Recursively deserialize children
            for (const childData of data._children) {
                this.deserializeNode(childData, node);
            }
            return node;
        }
        catch (error) {
            ui.logToOutput(`TreeSerializer: Failed to deserialize node "${data._type}":`, error);
            return undefined;
        }
    }
    /**
     * Serializes the entire tree to a JSON string.
     * @param rootNodes - Array of root-level nodes
     */
    static serializeTree(rootNodes) {
        const tree = {
            version: this.CURRENT_VERSION,
            savedAt: new Date().toISOString(),
            nodes: rootNodes.map(node => this.serializeNode(node))
        };
        return JSON.stringify(tree, null, 2);
    }
    /**
     * Deserializes a tree from JSON string.
     * @param json - Serialized tree JSON
     * @returns Array of root-level nodes, or empty array on failure
     */
    static deserializeTree(json) {
        try {
            const tree = JSON.parse(json);
            // Version check for future compatibility
            if (tree.version !== this.CURRENT_VERSION) {
                ui.logToOutput(`TreeSerializer: Version mismatch (saved: ${tree.version}, current: ${this.CURRENT_VERSION})`);
                // Future: add migration logic here
            }
            const nodes = [];
            for (const nodeData of tree.nodes) {
                const node = this.deserializeNode(nodeData);
                if (node) {
                    nodes.push(node);
                }
            }
            ui.logToOutput(`TreeSerializer: Loaded ${nodes.length} root nodes from saved state`);
            return nodes;
        }
        catch (error) {
            ui.logToOutput(`TreeSerializer: Failed to deserialize tree:`, error);
            return [];
        }
    }
    /**
     * Checks if a value can be serialized to JSON.
     */
    static isSerializable(value) {
        if (value === null || value === undefined) {
            return true;
        }
        const type = typeof value;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return true;
        }
        if (Array.isArray(value)) {
            return value.every(item => this.isSerializable(item));
        }
        if (type === 'object') {
            // Skip complex objects like vscode.Uri, NodeBase, etc.
            const proto = Object.getPrototypeOf(value);
            if (proto === Object.prototype || proto === null) {
                return Object.values(value).every(v => this.isSerializable(v));
            }
            return false;
        }
        return false;
    }
    /**
     * Checks if a property exists on the node (including private backing fields).
     */
    static isPrivateProperty(key, node) {
        return Object.prototype.hasOwnProperty.call(node, key);
    }
}
exports.TreeSerializer = TreeSerializer;
//# sourceMappingURL=TreeSerializer.js.map