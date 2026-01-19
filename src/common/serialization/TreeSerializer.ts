import { NodeBase } from '../../tree/NodeBase';
import { NodeRegistry } from './NodeRegistry';
import { getSerializableProperties } from './Serialize';
import * as ui from '../UI';

/**
 * Serialized representation of a node.
 */
export interface SerializedNode {
    _type: string;
    _id: string;
    _label: string;
    _properties: Record<string, unknown>;
    _children: SerializedNode[];
}

/**
 * Root structure for serialized tree data.
 */
export interface SerializedTree {
    version: number;
    savedAt: string;
    nodes: SerializedNode[];
}

/**
 * Handles serialization and deserialization of the node tree.
 * Converts between NodeBase instances and JSON-compatible structures.
 */
export class TreeSerializer {
    private static readonly CURRENT_VERSION = 1;

    /**
     * Serializes a single node and its children recursively.
     * Only properties marked with @Serialize() are included.
     */
    public static serializeNode(node: NodeBase): SerializedNode {
        const typeName = NodeRegistry.getTypeName(node);
        const serializableProps = getSerializableProperties(node);
        
        // Extract serializable properties
        const properties: Record<string, unknown> = {};
        for (const propKey of serializableProps) {
            const key = String(propKey);
            // Access both public and private properties
            const value = (node as any)[key];
            
            // Only serialize defined, serializable values
            if (value !== undefined && this.isSerializable(value)) {
                properties[key] = value;
            }
        }

        // Recursively serialize children
        const children = node.Children.map(child => this.serializeNode(child));

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
    public static deserializeNode(data: SerializedNode, parent?: NodeBase): NodeBase | undefined {
        const Constructor = NodeRegistry.get(data._type);
        
        if (!Constructor) {
            ui.logToOutput(`TreeSerializer: Unknown node type "${data._type}", skipping`);
            return undefined;
        }

        try {
            // Set deserializing flag to prevent auto-adding to tree
            NodeBase.IsDeserializing = true;
            
            // Create node with minimal constructor args
            // Most nodes take (label, parent?) as constructor args
            const node = new Constructor(data._label, parent);
            
            NodeBase.IsDeserializing = false;
            
            // Manually add to parent's Children (since constructor skipped this)
            if (parent) {
                parent.Children.push(node);
                node.Parent = parent;
            }
            
            // Override the auto-generated ID with the saved one
            if (data._id) {
                (node as any).id = data._id;
            }

            // Restore serialized properties
            for (const [key, value] of Object.entries(data._properties)) {
                if (key in node || this.isPrivateProperty(key, node)) {
                    (node as any)[key] = value;
                }
            }

            // Recursively deserialize children
            for (const childData of data._children) {
                this.deserializeNode(childData, node);
            }

            return node;
        } catch (error) {
            NodeBase.IsDeserializing = false;
            ui.logToOutput(`TreeSerializer: Failed to deserialize node "${data._type}":`, error as Error);
            return undefined;
        }
    }

    /**
     * Serializes the entire tree to a JSON string.
     * @param rootNodes - Array of root-level nodes
     */
    public static serializeTree(rootNodes: NodeBase[]): string {
        const tree: SerializedTree = {
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
    public static deserializeTree(json: string): NodeBase[] {
        try {
            const tree: SerializedTree = JSON.parse(json);
            
            // Version check for future compatibility
            if (tree.version !== this.CURRENT_VERSION) {
                ui.logToOutput(`TreeSerializer: Version mismatch (saved: ${tree.version}, current: ${this.CURRENT_VERSION})`);
                // Future: add migration logic here
            }

            const nodes: NodeBase[] = [];
            for (const nodeData of tree.nodes) {
                const node = this.deserializeNode(nodeData);
                if (node) {
                    nodes.push(node);
                }
            }

            ui.logToOutput(`TreeSerializer: Loaded ${nodes.length} root nodes from saved state`);
            return nodes;
        } catch (error) {
            ui.logToOutput(`TreeSerializer: Failed to deserialize tree:`, error as Error);
            return [];
        }
    }

    /**
     * Checks if a value can be serialized to JSON.
     */
    private static isSerializable(value: unknown): boolean {
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
    private static isPrivateProperty(key: string, node: NodeBase): boolean {
        return Object.prototype.hasOwnProperty.call(node, key);
    }
}
