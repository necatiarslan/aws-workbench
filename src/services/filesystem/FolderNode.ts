import { NodeBase } from '../../tree/NodeBase';
import { Serialize } from '../../common/serialization/Serialize';
import { NodeRegistry } from '../../common/serialization/NodeRegistry';

export class FolderNode extends NodeBase {

    constructor(FolderName: string, parent?: NodeBase) 
    {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
    }

    @Serialize()
    public FolderName: string = "";

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('FolderNode', FolderNode);