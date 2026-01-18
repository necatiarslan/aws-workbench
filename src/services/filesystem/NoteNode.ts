import { NodeBase } from '../../tree/NodeBase';

export class NoteNode extends NodeBase {

    constructor(NoteTitle: string, parent?: NodeBase) 
    {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;
    }

    public NoteTitle: string = "";
    public NoteContent: string = "";

}