import { Serialize } from '../common/serialization';
import { NodeBase } from '../tree/NodeBase';
import { TreeState } from '../tree/TreeState';
import * as ui from '../common/UI'
import { NodeRegistry } from '../common/serialization/NodeRegistry';

export class FileNode extends NodeBase {


    @Serialize()
    public FileName: string = "";

    @Serialize()
    public FilePath: string = "";
    
    constructor(label: string, parent?: NodeBase) 
    {
        super(label, parent);
        this.Icon = "file";
        this.FileName = label;

        this.EnableNodeRemove = true;
        this.EnableNodeOpen = true;
        this.EnableNodeAlias = true;
        this.SetContextValue();

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeOpen.subscribe(() => this.handleNodeOpen());
    }

    private handleNodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    private handleNodeOpen(): void {
        ui.openFile(this.FilePath);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('FileNode', FileNode);