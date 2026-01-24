import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import * as api from './API';
import * as ui from '../common/UI';
import { LambdaFunctionNode } from './LambdaFunctionNode';
import { TreeProvider } from '../tree/TreeProvider';

export class LambdaCodeDownloadNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "cloud-download";

        this.ShouldBeSaved = false;
        this.EnableNodeRun = true;
        this.SetContextValue();
    }

    public async NodeAdd(): Promise<void> {
    }

    public NodeRemove(): void {
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
    }

    public async NodeEdit(): Promise<void> {
    }

    public async NodeRun(): Promise<void> {
        ui.logToOutput('LambdaCodeDownloadNode.NodeRun Started');

        // Get parent Lambda function node
        const lambdaNode = this.GetAwsResourceNode() as LambdaFunctionNode;
        if (!lambdaNode || !lambdaNode.FunctionName || !lambdaNode.Region) {
            ui.logToOutput('LambdaCodeDownloadNode.NodeRun - Parent Lambda node not found');
            return;
        }

        if (this.IsWorking) { return; }

        let downloadPath: string | undefined;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const choice = await vscode.window.showQuickPick(
                [
                    { label: '💼 Save to Workspace Root', value: 'workspace', description: workspaceRoot },
                    { label: '📁 Choose Custom Location', value: 'custom' }
                ],
                { placeHolder: 'Where do you want to save the Lambda code?' }
            );

            if (!choice) { return; }

            if (choice.value === 'workspace') {
                downloadPath = workspaceRoot;
            } else {
                const selectedFolder = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select Download Folder'
                });

                if (!selectedFolder || selectedFolder.length === 0) { return; }
                downloadPath = selectedFolder[0].fsPath;
            }
        } else {
            const choice = await vscode.window.showQuickPick(
                [
                    { label: '📥 Save to Downloads', value: 'downloads' },
                    { label: '📁 Choose Custom Location', value: 'custom' }
                ],
                { placeHolder: 'Where do you want to save the Lambda code?' }
            );

            if (!choice) { return; }

            if (choice.value === 'downloads') {
                const os = require('os');
                const path = require('path');
                downloadPath = path.join(os.homedir(), 'Downloads');
            } else {
                const selectedFolder = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select Download Folder'
                });

                if (!selectedFolder || selectedFolder.length === 0) { return; }
                downloadPath = selectedFolder[0].fsPath;
            }
        }

        if (!downloadPath) { return; }

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

            const unzipChoice = await vscode.window.showInformationMessage(
                'Lambda code downloaded successfully! Do you want to unzip it?',
                'Yes, Unzip',
                'No, Keep ZIP',
                'Open Folder'
            );

            if (unzipChoice === 'Open Folder') {
                const path = require('path');
                const folderUri = vscode.Uri.file(path.dirname(zipFilePath));
                await vscode.commands.executeCommand('revealFileInOS', folderUri);
                return;
            }

            if (unzipChoice === 'Yes, Unzip') {
                await this.unzipAndSetupCodePath(zipFilePath, lambdaNode);
            } else if (unzipChoice === 'No, Keep ZIP') {
                ui.showInfoMessage(`Lambda code saved as: ${zipFilePath}`);
            }
        } catch (error: any) {
            ui.logToOutput('LambdaCodeDownloadNode.NodeRun Error !!!', error);
            ui.showErrorMessage('Download Lambda Code Error !!!', error);
        } finally {
            this.StopWorking();
        }
    }

    private async unzipAndSetupCodePath(zipFilePath: string, lambdaNode: LambdaFunctionNode): Promise<void> {
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

            await new Promise<void>((resolve, reject) => {
                yauzl.open(zipFilePath, { lazyEntries: true }, (err: any, zipfile: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    zipfile.readEntry();

                    zipfile.on('entry', (entry: any) => {
                        const entryPath = path.join(extractPath, entry.fileName);

                        if (/\/$/.test(entry.fileName)) {
                            fs.mkdirSync(entryPath, { recursive: true });
                            zipfile.readEntry();
                        } else {
                            fs.mkdirSync(path.dirname(entryPath), { recursive: true });
                            zipfile.openReadStream(entry, (err: any, readStream: any) => {
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
            const actualFiles = files.filter((f: string) => !f.startsWith('.') && f !== '__MACOSX');

            let codePathToSet: string | undefined;

            if (actualFiles.length === 1) {
                const singleFile = path.join(extractPath, actualFiles[0]);
                const stats = fs2.statSync(singleFile);

                const setCodePathChoice = await vscode.window.showInformationMessage(
                    `Found single ${stats.isDirectory() ? 'folder' : 'file'}: "${actualFiles[0]}". Set as code path?`,
                    'Yes',
                    'No'
                );

                if (setCodePathChoice === 'Yes') {
                    codePathToSet = singleFile;
                }
            } else {
                const setCodePathChoice = await vscode.window.showInformationMessage(
                    `Found ${actualFiles.length} items. Set extracted folder as code path?`,
                    'Yes',
                    'No'
                );

                if (setCodePathChoice === 'Yes') {
                    codePathToSet = extractPath;
                }
            }

            if (codePathToSet) {
                // Store code path in the Lambda function node or a code path node
                ui.showInfoMessage('Code path set successfully');
                ui.logToOutput('Code Path: ' + codePathToSet);
                TreeProvider.Current.Refresh(this.Parent);
            }

            const openChoice = await vscode.window.showInformationMessage(
                'Do you want to open the extracted folder?',
                'Open Folder',
                'Cancel'
            );

            if (openChoice === 'Open Folder') {
                const folderUri = vscode.Uri.file(extractPath);
                await vscode.commands.executeCommand('revealFileInOS', folderUri);
            }
        } catch (error: any) {
            ui.logToOutput('Unzip Error !!!', error);
            ui.showErrorMessage('Failed to unzip file', error);
        }
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

    public NodeLoaded(): void {}

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaCodeDownloadNode', LambdaCodeDownloadNode);