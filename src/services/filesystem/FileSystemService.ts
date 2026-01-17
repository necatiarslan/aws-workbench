import * as vscode from "vscode";
import { ServiceBase } from "../../tree/ServiceBase";
import { NodeBase } from "../../tree/NodeBase";
import { FolderNode } from "./FolderNode";

export class FileSystemService extends ServiceBase {   

    public static Current: FileSystemService;

    public constructor() {
        super();
        FileSystemService.Current = this;
    }

    public async Add(node?: NodeBase, type?: string) : Promise<void> {
        // Implementation for adding a file system resource
        if(type === "Folder"){
            let folderName = await vscode.window.showInputBox({placeHolder: 'Enter Folder Name'});
            if(!folderName){ return; }

            const newFolder = new FolderNode(folderName, node);
        } else if(type === "File"){
            console.log('Unsupported type for FileSystemService.Add');
        }
    }

}