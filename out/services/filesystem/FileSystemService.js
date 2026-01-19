"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const vscode = require("vscode");
const ServiceBase_1 = require("../../tree/ServiceBase");
const FolderNode_1 = require("./FolderNode");
const NoteNode_1 = require("./NoteNode");
const FileNode_1 = require("./FileNode");
const ui = require("../../common/UI");
const BashScriptNode_1 = require("./BashScriptNode");
const BashFileNode_1 = require("./BashFileNode");
class FileSystemService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        FileSystemService.Current = this;
    }
    async Add(node, type) {
        // Implementation for adding a file system resource
        if (type === "Folder") {
            let folderName = await vscode.window.showInputBox({ placeHolder: 'Enter Folder Name' });
            if (!folderName) {
                return;
            }
            const newFolder = new FolderNode_1.FolderNode(folderName, node);
        }
        else if (type === "Note") {
            let noteTitle = await vscode.window.showInputBox({ placeHolder: 'Enter Note Title' });
            if (!noteTitle) {
                return;
            }
            const newNote = new NoteNode_1.NoteNode(noteTitle, node);
        }
        else if (type === "File") {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let param = {
                canSelectFolders: false,
                canSelectFiles: true,
                openLabel: "Select File",
                title: "Select File",
                canSelectMany: false,
                defaultUri: workspaceFolder?.uri,
            };
            let selectedFileList = await vscode.window.showOpenDialog(param);
            if (!selectedFileList || selectedFileList.length == 0) {
                return;
            }
            const newFile = new FileNode_1.FileNode(ui.getFileNameWithExtension(selectedFileList[0].fsPath), selectedFileList[0].fsPath, node);
        }
        else if (type === "Bash Script") {
            let title = await vscode.window.showInputBox({ placeHolder: 'Enter Title' });
            if (!title) {
                return;
            }
            let script = await vscode.window.showInputBox({ placeHolder: 'Enter Script' });
            if (!script) {
                return;
            }
            const newNode = new BashScriptNode_1.BashScriptNode(title, node);
            newNode.Script = script;
        }
        else if (type === "Bash File") {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let param = {
                canSelectFolders: false,
                canSelectFiles: true,
                openLabel: "Select File",
                title: "Select File",
                canSelectMany: false,
                defaultUri: workspaceFolder?.uri,
            };
            let selectedFileList = await vscode.window.showOpenDialog(param);
            if (!selectedFileList || selectedFileList.length == 0) {
                return;
            }
            const newFile = new BashFileNode_1.BashFileNode(ui.getFileNameWithExtension(selectedFileList[0].fsPath), selectedFileList[0].fsPath, node);
        }
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=FileSystemService.js.map