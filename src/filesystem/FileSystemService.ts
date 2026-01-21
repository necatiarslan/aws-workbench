import * as vscode from "vscode";
import { ServiceBase } from "../tree/ServiceBase";
import { NodeBase } from "../tree/NodeBase";
import { FolderNode } from "./FolderNode";
import { NoteNode } from "./NoteNode";
import { FileNode } from "./FileNode";
import * as ui from "../common/UI";
import { BashScriptNode } from "./BashScriptNode";
import { BashFileNode } from "./BashFileNode";

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
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

            let param = {
                canSelectFolders:false,
                canSelectFiles:true,
                openLabel:"Select File",
                title:"Select File",
                canSelectMany: false,
                defaultUri: workspaceFolder?.uri,
            }
            let selectedFileList = await vscode.window.showOpenDialog(param);
            if(!selectedFileList || selectedFileList.length == 0){ return; }

            const newFile = new FileNode(ui.getFileNameWithExtension(selectedFileList[0].fsPath), node);
            newFile.FilePath = selectedFileList[0].fsPath;
        } else if(type === "Bash Script"){
            let title = await vscode.window.showInputBox({placeHolder: 'Enter Title'});
            if(!title){ return; }

            let script = await vscode.window.showInputBox({placeHolder: 'Enter Script'});
            if(!script){ return; }

            const newNode = new BashScriptNode(title, node);
            newNode.Script = script;
            
        } else if(type === "Bash File"){
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let param = {
                canSelectFolders:false,
                canSelectFiles:true,
                openLabel:"Select File",
                title:"Select File",
                canSelectMany: false,
                defaultUri: workspaceFolder?.uri,
            }
            let selectedFileList = await vscode.window.showOpenDialog(param);
            if(!selectedFileList || selectedFileList.length == 0){ return; }

            const newFile = new BashFileNode(ui.getFileNameWithExtension(selectedFileList[0].fsPath), node);
            newFile.FilePath = selectedFileList[0].fsPath;
        }
    }

}