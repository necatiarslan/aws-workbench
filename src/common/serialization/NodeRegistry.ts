import { NodeBase } from '../../tree/NodeBase';

/**
 * Type for node constructor functions.
 * Must be a constructor that creates a NodeBase instance.
 */
export type NodeConstructor = new (...args: any[]) => NodeBase;

/**
 * Registry mapping type names to node constructors.
 * Enables deserialization to create correct class instances.
 * 
 * Each node class must register itself:
 * @example
 * NodeRegistry.register('NoteNode', NoteNode);
 */
export class NodeRegistry {
    private static _registry: Map<string, NodeConstructor> = new Map();

    /**
     * Registers a node type with its constructor.
     * @param typeName - Unique string identifier for the node type
     * @param constructor - The class constructor
     */
    public static register(typeName: string, constructor: NodeConstructor): void {
        if (this._registry.has(typeName)) {
            console.warn(`NodeRegistry: Overwriting existing type "${typeName}"`);
        }
        this._registry.set(typeName, constructor);
    }

    /**
     * Gets the constructor for a registered type name.
     * @param typeName - The type name to look up
     * @returns The constructor, or undefined if not registered
     */
    public static get(typeName: string): NodeConstructor | undefined {
        return this._registry.get(typeName);
    }

    /**
     * Checks if a type is registered.
     * @param typeName - The type name to check
     */
    public static has(typeName: string): boolean {
        return this._registry.has(typeName);
    }

    /**
     * Gets all registered type names.
     */
    public static getRegisteredTypes(): string[] {
        return Array.from(this._registry.keys());
    }

    /**
     * Gets the type name for a node instance.
     * Uses the constructor name by default.
     * @param node - The node instance
     */
    public static getTypeName(node: NodeBase): string {
        return node.constructor.name;
    }
}
