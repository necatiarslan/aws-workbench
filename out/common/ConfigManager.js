"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const ui = require("./UI");
class ConfigManager {
    static CONFIG_FILENAME = 'aws-workbench.yaml';
    /**
     * Parse S3 bucket ARN to extract bucket name
     * ARN format: arn:aws:s3:::bucket-name
     */
    static parseBucketArn(bucketIdentifier) {
        const arnPattern = /^arn:aws:s3:::(.+)$/;
        const match = bucketIdentifier.match(arnPattern);
        if (match && match[1]) {
            return match[1];
        }
        // If it's not an ARN, return as-is (it's already a bucket name)
        return bucketIdentifier;
    }
    /**
     * Convert bucket name to ARN format
     */
    static bucketNameToArn(bucketName) {
        // If already an ARN, return as-is
        if (bucketName.startsWith('arn:aws:s3:::')) {
            return bucketName;
        }
        return `arn:aws:s3:::${bucketName}`;
    }
    /**
     * Find config file in workspace root or .vscode folder
     * Priority:
     * 1. .vscode/aws-workbench.yaml (workspace-specific)
     * 2. aws-workbench.yaml (workspace root)
     */
    static findConfigFile() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        // Check .vscode folder first (workspace-specific configuration)
        const vscodeConfigPath = path.join(workspaceRoot, '.vscode', this.CONFIG_FILENAME);
        if (fs.existsSync(vscodeConfigPath)) {
            ui.logToOutput(`ConfigManager: Found config in .vscode folder: ${vscodeConfigPath}`);
            return vscodeConfigPath;
        }
        // Check workspace root
        const rootConfigPath = path.join(workspaceRoot, this.CONFIG_FILENAME);
        if (fs.existsSync(rootConfigPath)) {
            ui.logToOutput(`ConfigManager: Found config in workspace root: ${rootConfigPath}`);
            return rootConfigPath;
        }
        return undefined;
    }
    /**
     * Convert YAML format to internal format
     */
    static yamlToInternal(yamlConfig) {
        const tree = [];
        const bucketList = [];
        const shortcutList = [];
        if (yamlConfig.root && Array.isArray(yamlConfig.root)) {
            for (const entry of yamlConfig.root) {
                const item = this.parseYamlEntry(entry, bucketList, shortcutList);
                if (item) {
                    tree.push(item);
                }
            }
        }
        return { BucketList: bucketList, ShortcutList: shortcutList, Tree: tree };
    }
    static parseYamlEntry(entry, bucketList, shortcutList) {
        if ('folder' in entry) {
            // It's a folder
            const folderEntry = entry;
            const children = [];
            if (folderEntry.resources && Array.isArray(folderEntry.resources)) {
                for (const res of folderEntry.resources) {
                    const child = this.parseYamlEntry(res, bucketList, shortcutList);
                    if (child) {
                        children.push(child);
                    }
                }
            }
            return {
                type: 'folder',
                name: folderEntry.folder,
                children: children
            };
        }
        else if ('s3' in entry) {
            // It's a bucket
            const bucketEntry = entry;
            const bucketName = this.parseBucketArn(bucketEntry.s3);
            // Add to flat lists for backward compatibility / quick lookup
            if (!bucketList.includes(bucketName)) {
                bucketList.push(bucketName);
            }
            const shortcuts = [];
            if (bucketEntry.shortcuts && Array.isArray(bucketEntry.shortcuts)) {
                for (const shortcut of bucketEntry.shortcuts) {
                    shortcuts.push(shortcut);
                    shortcutList.push({
                        Bucket: bucketName,
                        Shortcut: shortcut
                    });
                }
            }
            return {
                type: 'bucket',
                name: bucketName,
                shortcuts: shortcuts
            };
        }
        return undefined;
    }
    /**
     * Convert internal format to YAML format
     */
    static internalToYaml(tree) {
        const root = [];
        for (const item of tree) {
            const entry = this.serializeConfigItem(item);
            if (entry) {
                root.push(entry);
            }
        }
        return { root };
    }
    static serializeConfigItem(item) {
        if (item.type === 'folder') {
            const children = [];
            if (item.children) {
                for (const child of item.children) {
                    const childEntry = this.serializeConfigItem(child);
                    if (childEntry) {
                        children.push(childEntry);
                    }
                }
            }
            const entry = {
                folder: item.name
            };
            if (children.length > 0) {
                entry.resources = children;
            }
            return entry;
        }
        else if (item.type === 'bucket') {
            const entry = {
                s3: this.bucketNameToArn(item.name)
            };
            if (item.shortcuts && item.shortcuts.length > 0) {
                entry.shortcuts = item.shortcuts;
            }
            return entry;
        }
        return undefined;
    }
    /**
     * Load configuration from YAML file
     */
    static loadConfig() {
        ui.logToOutput('ConfigManager.loadConfig Started');
        try {
            const configPath = this.findConfigFile();
            if (!configPath) {
                ui.logToOutput('ConfigManager: No config file found');
                return undefined;
            }
            ui.logToOutput(`ConfigManager: Loading config from ${configPath}`);
            const fileContents = fs.readFileSync(configPath, 'utf8');
            const yamlConfig = yaml.load(fileContents);
            // Convert YAML format to internal format
            const config = this.yamlToInternal(yamlConfig);
            ui.logToOutput(`ConfigManager: Config loaded successfully. Tree items: ${config.Tree?.length || 0}`);
            return config;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ui.logToOutput('ConfigManager.loadConfig Error !!!', err);
            ui.showErrorMessage('Error loading aws-workbench.yaml configuration', err);
            return undefined;
        }
    }
    /**
     * Save configuration to YAML file
     */
    static async saveConfig(tree) {
        ui.logToOutput('ConfigManager.saveConfig Started');
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                ui.showWarningMessage('No workspace folder open. Cannot save config file.');
                return false;
            }
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const configPath = path.join(workspaceRoot, this.CONFIG_FILENAME);
            // Convert internal format to YAML format
            const yamlConfig = this.internalToYaml(tree);
            const yamlStr = yaml.dump(yamlConfig, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
            fs.writeFileSync(configPath, yamlStr, 'utf8');
            ui.logToOutput(`ConfigManager: Config saved successfully to ${configPath}`);
            ui.showInfoMessage(`Configuration saved to ${this.CONFIG_FILENAME}`);
            return true;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ui.logToOutput('ConfigManager.saveConfig Error !!!', err);
            ui.showErrorMessage('Error saving aws-workbench.yaml configuration', err);
            return false;
        }
    }
    /**
     * Export current state to YAML config file
     */
    static async exportToConfig(tree) {
        ui.logToOutput('ConfigManager.exportToConfig Started');
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const openFolder = await vscode.window.showErrorMessage('No workspace folder open. Please open a folder to save the configuration.', 'Open Folder');
            if (openFolder === 'Open Folder') {
                vscode.commands.executeCommand('vscode.openFolder');
            }
            return;
        }
        // Ask user where to save the config file
        const saveLocation = await vscode.window.showQuickPick([
            {
                label: '$(folder) Workspace Root',
                description: 'Save in workspace root folder (shared with team)',
                value: 'root'
            },
            {
                label: '$(file) .vscode Folder',
                description: 'Save in .vscode folder (workspace-specific)',
                value: 'vscode'
            }
        ], {
            placeHolder: 'Choose where to save aws-workbench.yaml'
        });
        if (!saveLocation) {
            return; // User cancelled
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        let configPath;
        if (saveLocation.value === 'vscode') {
            // Ensure .vscode folder exists
            const vscodeFolder = path.join(workspaceRoot, '.vscode');
            if (!fs.existsSync(vscodeFolder)) {
                fs.mkdirSync(vscodeFolder, { recursive: true });
            }
            configPath = path.join(vscodeFolder, this.CONFIG_FILENAME);
        }
        else {
            configPath = path.join(workspaceRoot, this.CONFIG_FILENAME);
        }
        // Save the config
        try {
            const yamlConfig = this.internalToYaml(tree);
            const yamlStr = yaml.dump(yamlConfig, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
            fs.writeFileSync(configPath, yamlStr, 'utf8');
            ui.logToOutput(`ConfigManager: Config saved successfully to ${configPath}`);
            ui.showInfoMessage(`Configuration saved to ${path.relative(workspaceRoot, configPath)}`);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            ui.logToOutput('ConfigManager.exportToConfig Error !!!', err);
            ui.showErrorMessage('Error saving aws-workbench.yaml configuration', err);
        }
    }
    /**
     * Check if config file exists
     */
    static hasConfigFile() {
        return this.findConfigFile() !== undefined;
    }
    /**
     * Get config file path
     */
    static getConfigFilePath() {
        return this.findConfigFile();
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map