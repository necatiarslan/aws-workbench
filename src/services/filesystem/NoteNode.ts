import { NodeBase } from '../../tree/NodeBase';
import { Serialize } from '../../common/serialization/Serialize';
import { NodeRegistry } from '../../common/serialization/NodeRegistry';

export class NoteNode extends NodeBase {

    constructor(NoteTitle: string, parent?: NodeBase) 
    {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;
    }

    @Serialize()
    public NoteTitle: string = "";

    @Serialize()
    public NoteContent: string = "";

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('NoteNode', NoteNode);