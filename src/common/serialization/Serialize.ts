import 'reflect-metadata';

/**
 * Metadata key for storing serializable property names.
 * Uses a Symbol to avoid collisions with other metadata.
 */
const SERIALIZE_METADATA_KEY = Symbol('serialize:properties');

/**
 * Property decorator that marks a property for serialization.
 * When a class instance is serialized, only properties marked with @Serialize()
 * will be included in the output.
 * 
 * @example
 * class NoteNode extends NodeBase {
 *     @Serialize()
 *     public NoteTitle: string = "";
 *     
 *     @Serialize()
 *     public NoteContent: string = "";
 * }
 */
export function Serialize(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        // Get existing serializable properties or create new array
        const existingProperties: (string | symbol)[] = 
            Reflect.getMetadata(SERIALIZE_METADATA_KEY, target.constructor) || [];
        
        // Add this property if not already present
        if (!existingProperties.includes(propertyKey)) {
            existingProperties.push(propertyKey);
        }
        
        // Store updated list on the constructor
        Reflect.defineMetadata(SERIALIZE_METADATA_KEY, existingProperties, target.constructor);
    };
}

/**
 * Gets all serializable property names for a class, including inherited properties.
 * 
 * @param target - The class constructor or prototype to get properties from
 * @returns Array of property names marked with @Serialize()
 */
export function getSerializableProperties(target: Object): (string | symbol)[] {
    const result: (string | symbol)[] = [];
    
    // Walk up the prototype chain to collect all serializable properties
    let currentTarget = typeof target === 'function' ? target : target.constructor;
    
    while (currentTarget && currentTarget !== Object) {
        const properties: (string | symbol)[] = 
            Reflect.getMetadata(SERIALIZE_METADATA_KEY, currentTarget) || [];
        
        // Add properties not already in result (child properties take precedence)
        for (const prop of properties) {
            if (!result.includes(prop)) {
                result.push(prop);
            }
        }
        
        // Move up the prototype chain
        currentTarget = Object.getPrototypeOf(currentTarget);
    }
    
    return result;
}
