import { NodeBase } from '../../tree/NodeBase';

export class FolderNode extends NodeBase {

    constructor(FolderName: string, parent?: NodeBase) 
    {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
    }

    public FolderName: string = "";


    

}