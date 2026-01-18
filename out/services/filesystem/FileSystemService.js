"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const vscode = require("vscode");
const ServiceBase_1 = require("../../tree/ServiceBase");
const FolderNode_1 = require("./FolderNode");
const NoteNode_1 = require("./NoteNode");
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
            console.log('Unsupported type for FileSystemService.Add');
        }
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=FileSystemService.js.map