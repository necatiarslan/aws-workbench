/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as ui from './UI';

export interface WorkbenchConfig {
	BucketList?: string[];
	ShortcutList?: { Bucket: string; Shortcut: string }[];
}

interface YamlBucketEntry {
	s3: string;
	shortcuts?: string[];
}

interface YamlConfig {
	root?: YamlBucketEntry[];
}

export class ConfigManager {
	private static readonly CONFIG_FILENAME = 'aws-workbench.yaml';

	/**
	 * Parse S3 bucket ARN to extract bucket name
	 * ARN format: arn:aws:s3:::bucket-name
	 */
	private static parseBucketArn(bucketIdentifier: string): string {
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
	private static bucketNameToArn(bucketName: string): string {
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
	private static findConfigFile(): string | undefined {
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
	private static yamlToInternal(yamlConfig: YamlConfig): WorkbenchConfig {
		const bucketList: string[] = [];
		const shortcutList: { Bucket: string; Shortcut: string }[] = [];

		if (yamlConfig.root && Array.isArray(yamlConfig.root)) {
			for (const entry of yamlConfig.root) {
				if (entry.s3) {
					const bucketName = this.parseBucketArn(entry.s3);
					bucketList.push(bucketName);

					// Add shortcuts for this bucket
					if (entry.shortcuts && Array.isArray(entry.shortcuts)) {
						for (const shortcut of entry.shortcuts) {
							shortcutList.push({
								Bucket: bucketName,
								Shortcut: shortcut
							});
						}
					}
				}
			}
		}

		return { BucketList: bucketList, ShortcutList: shortcutList };
	}

	/**
	 * Convert internal format to YAML format
	 */
	private static internalToYaml(bucketList: string[], shortcutList: { Bucket: string; Shortcut: string }[]): YamlConfig {
		const root: YamlBucketEntry[] = [];

		// Group shortcuts by bucket
		const shortcutsByBucket = new Map<string, string[]>();
		for (const shortcut of shortcutList) {
			const bucket = shortcut.Bucket;
			if (!shortcutsByBucket.has(bucket)) {
				shortcutsByBucket.set(bucket, []);
			}
			shortcutsByBucket.get(bucket)!.push(shortcut.Shortcut);
		}

		// Create entries for all buckets
		for (const bucket of bucketList) {
			const entry: YamlBucketEntry = {
				s3: this.bucketNameToArn(bucket)
			};

			const shortcuts = shortcutsByBucket.get(bucket);
			if (shortcuts && shortcuts.length > 0) {
				entry.shortcuts = shortcuts;
			}

			root.push(entry);
		}

		return { root };
	}

	/**
	 * Load configuration from YAML file
	 */
	public static loadConfig(): WorkbenchConfig | undefined {
		ui.logToOutput('ConfigManager.loadConfig Started');
		
		try {
			const configPath = this.findConfigFile();
			
			if (!configPath) {
				ui.logToOutput('ConfigManager: No config file found');
				return undefined;
			}

			ui.logToOutput(`ConfigManager: Loading config from ${configPath}`);
			
			const fileContents = fs.readFileSync(configPath, 'utf8');
			const yamlConfig = yaml.load(fileContents) as YamlConfig;

			// Convert YAML format to internal format
			const config = this.yamlToInternal(yamlConfig);

			ui.logToOutput(`ConfigManager: Config loaded successfully. Buckets: ${config.BucketList?.length || 0}, Shortcuts: ${config.ShortcutList?.length || 0}`);
			return config;

		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			ui.logToOutput('ConfigManager.loadConfig Error !!!', err);
			ui.showErrorMessage('Error loading aws-workbench.yaml configuration', err);
			return undefined;
		}
	}

	/**
	 * Save configuration to YAML file
	 */
	public static async saveConfig(bucketList: string[], shortcutList: { Bucket: string; Shortcut: string }[]): Promise<boolean> {
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
			const yamlConfig = this.internalToYaml(bucketList, shortcutList);

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

		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			ui.logToOutput('ConfigManager.saveConfig Error !!!', err);
			ui.showErrorMessage('Error saving aws-workbench.yaml configuration', err);
			return false;
		}
	}

	/**
	 * Export current state to YAML config file
	 */
	public static async exportToConfig(bucketList: string[], shortcutList: { Bucket: string; Shortcut: string }[]): Promise<void> {
		ui.logToOutput('ConfigManager.exportToConfig Started');
		
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (!workspaceFolders || workspaceFolders.length === 0) {
			const openFolder = await vscode.window.showErrorMessage(
				'No workspace folder open. Please open a folder to save the configuration.',
				'Open Folder'
			);
			
			if (openFolder === 'Open Folder') {
				vscode.commands.executeCommand('vscode.openFolder');
			}
			return;
		}

		// Ask user where to save the config file
		const saveLocation = await vscode.window.showQuickPick(
			[
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
			],
			{
				placeHolder: 'Choose where to save aws-workbench.yaml'
			}
		);

		if (!saveLocation) {
			return; // User cancelled
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		let configPath: string;

		if (saveLocation.value === 'vscode') {
			// Ensure .vscode folder exists
			const vscodeFolder = path.join(workspaceRoot, '.vscode');
			if (!fs.existsSync(vscodeFolder)) {
				fs.mkdirSync(vscodeFolder, { recursive: true });
			}
			configPath = path.join(vscodeFolder, this.CONFIG_FILENAME);
		} else {
			configPath = path.join(workspaceRoot, this.CONFIG_FILENAME);
		}

		// Save the config
		try {
			const yamlConfig = this.internalToYaml(bucketList, shortcutList);
			const yamlStr = yaml.dump(yamlConfig, {
				indent: 2,
				lineWidth: -1,
				noRefs: true,
				sortKeys: false
			});

			fs.writeFileSync(configPath, yamlStr, 'utf8');
			
			ui.logToOutput(`ConfigManager: Config saved successfully to ${configPath}`);
			ui.showInfoMessage(`Configuration saved to ${path.relative(workspaceRoot, configPath)}`);

		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			ui.logToOutput('ConfigManager.exportToConfig Error !!!', err);
			ui.showErrorMessage('Error saving aws-workbench.yaml configuration', err);
		}
	}

	/**
	 * Check if config file exists
	 */
	public static hasConfigFile(): boolean {
		return this.findConfigFile() !== undefined;
	}

	/**
	 * Get config file path
	 */
	public static getConfigFilePath(): string | undefined {
		return this.findConfigFile();
	}
}
