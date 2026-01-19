"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRegistry = void 0;
/**
 * Registry mapping type names to node constructors.
 * Enables deserialization to create correct class instances.
 *
 * Each node class must register itself:
 * @example
 * NodeRegistry.register('NoteNode', NoteNode);
 */
class NodeRegistry {
    static _registry = new Map();
    /**
     * Registers a node type with its constructor.
     * @param typeName - Unique string identifier for the node type
     * @param constructor - The class constructor
     */
    static register(typeName, constructor) {
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
    static get(typeName) {
        return this._registry.get(typeName);
    }
    /**
     * Checks if a type is registered.
     * @param typeName - The type name to check
     */
    static has(typeName) {
        return this._registry.has(typeName);
    }
    /**
     * Gets all registered type names.
     */
    static getRegisteredTypes() {
        return Array.from(this._registry.keys());
    }
    /**
     * Gets the type name for a node instance.
     * Uses the constructor name by default.
     * @param node - The node instance
     */
    static getTypeName(node) {
        return node.constructor.name;
    }
}
exports.NodeRegistry = NodeRegistry;
//# sourceMappingURL=NodeRegistry.js.map