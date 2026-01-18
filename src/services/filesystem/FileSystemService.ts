import * as vscode from "vscode";
import { ServiceBase } from "../../tree/ServiceBase";
import { NodeBase } from "../../tree/NodeBase";
import { FolderNode } from "./FolderNode";
import { NoteNode } from "./NoteNode";

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
        } else if(type === "Note"){
            let noteTitle = await vscode.window.showInputBox({placeHolder: 'Enter Note Title'});
            if(!noteTitle){ return; }

            const newNote = new NoteNode(noteTitle, node);
        } else if(type === "File"){
            console.log('Unsupported type for FileSystemService.Add');
        }
    }

}