import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import { NoteView } from './NoteView';

export class NoteNode extends NodeBase {

    @Serialize()
    public NoteTitle: string = "";

    @Serialize()
    public NoteContent: string = "";

    constructor(NoteTitle: string, parent?: NodeBase) 
    {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;

        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());

        this.SetContextValue();
    }

    private handleNodeRemove(): void {
        this.Remove();
        this.TreeSave();
    }

    private async handleNodeEdit(): Promise<void> {
        // Open in rich text editor
        NoteView.Render(this);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('NoteNode', NoteNode);