import { TreeItemBase } from '../../tree/TreeItemBase';

export class FolderTreeItem extends TreeItemBase {

    constructor(FolderName: string, parent?: TreeItemBase) 
    {
        super(FolderName, parent);
        this.Icon = "folder";
        this.FolderName = FolderName;
    }

    public FolderName: string = "";


    

}