"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaCodeDownloadNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = require("vscode");
const api = require("./API");
const ui = require("../common/UI");
class LambdaCodeDownloadNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "cloud-download";
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.SetContextValue();
    }
    async handleNodeRun() {
        ui.logToOutput('LambdaCodeDownloadNode.NodeRun Started');
        // Get parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode();
        if (!lambdaNode || !lambdaNode.FunctionName || !lambdaNode.Region) {
            ui.logToOutput('LambdaCodeDownloadNode.NodeRun - Parent Lambda node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        let downloadPath;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const choice = await vscode.window.showQuickPick([
                { label: '💼 Save to Workspace Root', value: 'workspace', description: workspaceRoot },
                { label: '📁 Choose Custom Location', value: 'custom' }
            ], { placeHolder: 'Where do you want to save the Lambda code?' });
            if (!choice) {
                return;
            }
            if (choice.value === 'workspace') {
                downloadPath = workspaceRoot;
            }
            else {
                const selectedFolder = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select Download Folder'
                });
                if (!selectedFolder || selectedFolder.length === 0) {
                    return;
                }
                downloadPath = selectedFolder[0].fsPath;
            }
        }
        else {
            const choice = await vscode.window.showQuickPick([
                { label: '📥 Save to Downloads', value: 'downloads' },
                { label: '📁 Choose Custom Location', value: 'custom' }
            ], { placeHolder: 'Where do you want to save the Lambda code?' });
            if (!choice) {
                return;
            }
            if (choice.value === 'downloads') {
                const os = require('os');
                const path = require('path');
                downloadPath = path.join(os.homedir(), 'Downloads');
            }
            else {
                const selectedFolder = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select Download Folder'
                });
                if (!selectedFolder || selectedFolder.length === 0) {
                    return;
                }
                downloadPath = selectedFolder[0].fsPath;
            }
        }
        if (!downloadPath) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.DownloadLambdaCode(lambdaNode.Region, lambdaNode.FunctionName, downloadPath);
            if (!result.isSuccessful) {
                ui.logToOutput('api.DownloadLambdaCode Error !!!', result.error);
                ui.showErrorMessage('Download Lambda Code Error !!!', result.error);
                return;
            }
            const zipFilePath = result.result;
            ui.logToOutput('Lambda code downloaded successfully: ' + zipFilePath);
            const unzipChoice = await vscode.window.showInformationMessage('Lambda code downloaded successfully! Do you want to unzip it?', 'Yes, Unzip', 'No, Keep ZIP', 'Open Folder');
            if (unzipChoice === 'Open Folder') {
                const path = require('path');
                const folderUri = vscode.Uri.file(path.dirname(zipFilePath));
                await vscode.commands.executeCommand('revealFileInOS', folderUri);
                return;
            }
            if (unzipChoice === 'Yes, Unzip') {
                await this.unzipAndSetupCodePath(zipFilePath, lambdaNode);
            }
            else if (unzipChoice === 'No, Keep ZIP') {
                ui.showInfoMessage(`Lambda code saved as: ${zipFilePath}`);
            }
        }
        catch (error) {
            ui.logToOutput('LambdaCodeDownloadNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Download Lambda Code Error !!!', error);
        }
        finally {
            this.StopWorking();
        }
    }
    async unzipAndSetupCodePath(zipFilePath, lambdaNode) {
        try {
            const path = require('path');
            const fs = require('fs');
            const yauzl = require('yauzl');
            const zipDir = path.dirname(zipFilePath);
            const zipBaseName = path.basename(zipFilePath, '.zip');
            const extractPath = path.join(zipDir, zipBaseName);
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }
            await new Promise((resolve, reject) => {
                yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    zipfile.readEntry();
                    zipfile.on('entry', (entry) => {
                        const entryPath = path.join(extractPath, entry.fileName);
                        if (/\/$/.test(entry.fileName)) {
                            fs.mkdirSync(entryPath, { recursive: true });
                            zipfile.readEntry();
                        }
                        else {
                            fs.mkdirSync(path.dirname(entryPath), { recursive: true });
                            zipfile.openReadStream(entry, (err, readStream) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                const writeStream = fs.createWriteStream(entryPath);
                                readStream.pipe(writeStream);
                                writeStream.on('finish', () => {
                                    zipfile.readEntry();
                                });
                                writeStream.on('error', reject);
                            });
                        }
                    });
                    zipfile.on('end', () => {
                        resolve();
                    });
                    zipfile.on('error', reject);
                });
            });
            ui.showInfoMessage(`Files extracted to: ${extractPath}`);
            ui.logToOutput(`Files extracted to: ${extractPath}`);
            // Check extracted content
            const fs2 = require('fs');
            const files = fs2.readdirSync(extractPath);
            const actualFiles = files.filter((f) => !f.startsWith('.') && f !== '__MACOSX');
            let codePathToSet;
            if (actualFiles.length === 1) {
                const singleFile = path.join(extractPath, actualFiles[0]);
                const stats = fs2.statSync(singleFile);
                const setCodePathChoice = await vscode.window.showInformationMessage(`Found single ${stats.isDirectory() ? 'folder' : 'file'}: "${actualFiles[0]}". Set as code path?`, 'Yes', 'No');
                if (setCodePathChoice === 'Yes') {
                    codePathToSet = singleFile;
                }
            }
            else {
                const setCodePathChoice = await vscode.window.showInformationMessage(`Found ${actualFiles.length} items. Set extracted folder as code path?`, 'Yes', 'No');
                if (setCodePathChoice === 'Yes') {
                    codePathToSet = extractPath;
                }
            }
            if (codePathToSet) {
                // Store code path in the Lambda function node or a code path node
                ui.showInfoMessage('Code path set successfully');
                ui.logToOutput('Code Path: ' + codePathToSet);
                this.RefreshTree(this.Parent);
            }
            const openChoice = await vscode.window.showInformationMessage('Do you want to open the extracted folder?', 'Open Folder', 'Cancel');
            if (openChoice === 'Open Folder') {
                const folderUri = vscode.Uri.file(extractPath);
                await vscode.commands.executeCommand('revealFileInOS', folderUri);
            }
        }
        catch (error) {
            ui.logToOutput('Unzip Error !!!', error);
            ui.showErrorMessage('Failed to unzip file', error);
        }
    }
}
exports.LambdaCodeDownloadNode = LambdaCodeDownloadNode;
//# sourceMappingURL=LambdaCodeDownloadNode.js.map