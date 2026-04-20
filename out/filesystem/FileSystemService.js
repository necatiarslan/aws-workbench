"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const vscode = __importStar(require("vscode"));
const ServiceBase_1 = require("../tree/ServiceBase");
const FolderNode_1 = require("./FolderNode");
const NoteNode_1 = require("./NoteNode");
const FileNode_1 = require("./FileNode");
const ui = __importStar(require("../common/UI"));
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
        else if (type === "File Link") {
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
            const newFile = new FileNode_1.FileNode(ui.getFileNameWithExtension(selectedFileList[0].fsPath), node);
            newFile.FilePath = selectedFileList[0].fsPath;
            newFile.CustomTooltip = selectedFileList[0].fsPath;
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
            const newFile = new BashFileNode_1.BashFileNode(ui.getFileNameWithExtension(selectedFileList[0].fsPath), node);
            newFile.FilePath = selectedFileList[0].fsPath;
            newFile.CustomTooltip = selectedFileList[0].fsPath;
        }
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=FileSystemService.js.map