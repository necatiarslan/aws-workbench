/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as ui from './UI';

export interface ConfigItem {
	type: 'bucket' | 'folder';
	name: string;
	children?: ConfigItem[];
	shortcuts?: string[];
}

export interface WorkbenchConfig {
	BucketList?: string[];
	ShortcutList?: { Bucket: string; Shortcut: string }[];
	Tree?: ConfigItem[];
}

interface YamlBucketEntry {
	s3: string;
	shortcuts?: string[];
}

interface YamlFolderEntry {
	folder: string;
	resources?: (YamlBucketEntry | YamlFolderEntry)[];
}

type YamlEntry = YamlBucketEntry | YamlFolderEntry;

interface YamlConfig {
	root?: YamlEntry[];
}

export class ConfigManager {
	private static readonly CONFIG_FILENAME = 'aws-workbench.yaml';
	private static extensionPath: string | undefined;

	public static setExtensionPath(path: string) {
		this.extensionPath = path;
	}

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
	 * Get the configuration file path based on workspace state
	 * 
	 * Logic:
	 * 1. If workspace open:
	 *    - Check .vscode/aws-workbench.yaml
	 *    - Check aws-workbench.yaml in root
	 *    - Default to aws-workbench.yaml in root
	 * 2. If no workspace:
	 *    - Use aws-workbench.yaml in extension path
	 */
	private static getConfigPath(): string {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (workspaceFolders && workspaceFolders.length > 0) {
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			
			// Check .vscode folder first
			const vscodeConfigPath = path.join(workspaceRoot, '.vscode', this.CONFIG_FILENAME);
			if (fs.existsSync(vscodeConfigPath)) {
				return vscodeConfigPath;
			}

			// Check workspace root
			const rootConfigPath = path.join(workspaceRoot, this.CONFIG_FILENAME);
			// If exists or not, we default to root for new files if not found in .vscode
			return rootConfigPath;
		}

		// No workspace, use extension path
		if (this.extensionPath) {
			return path.join(this.extensionPath, this.CONFIG_FILENAME);
		}

		throw new Error('Extension path not set and no workspace open');
	}

	/**
	 * Convert YAML format to internal format
	 */
	private static yamlToInternal(yamlConfig: YamlConfig): WorkbenchConfig {
		const tree: ConfigItem[] = [];
		const bucketList: string[] = [];
		const shortcutList: { Bucket: string; Shortcut: string }[] = [];

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

	private static parseYamlEntry(
		entry: YamlEntry, 
		bucketList: string[], 
		shortcutList: { Bucket: string; Shortcut: string }[]
	): ConfigItem | undefined {
		if ('folder' in entry) {
			// It's a folder
			const folderEntry = entry as YamlFolderEntry;
			const children: ConfigItem[] = [];
			
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
		} else if ('s3' in entry) {
			// It's a bucket
			const bucketEntry = entry as YamlBucketEntry;
			const bucketName = this.parseBucketArn(bucketEntry.s3);
			
			// Add to flat lists for backward compatibility / quick lookup
			if (!bucketList.includes(bucketName)) {
				bucketList.push(bucketName);
			}

			const shortcuts: string[] = [];
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
	private static internalToYaml(tree: ConfigItem[]): YamlConfig {
		const root: YamlEntry[] = [];

		for (const item of tree) {
			const entry = this.serializeConfigItem(item);
			if (entry) {
				root.push(entry);
			}
		}

		return { root };
	}

	private static serializeConfigItem(item: ConfigItem): YamlEntry | undefined {
		if (item.type === 'folder') {
			const children: YamlEntry[] = [];
			if (item.children) {
				for (const child of item.children) {
					const childEntry = this.serializeConfigItem(child);
					if (childEntry) {
						children.push(childEntry);
					}
				}
			}
			
			const entry: YamlFolderEntry = {
				folder: item.name
			};
			
			if (children.length > 0) {
				entry.resources = children;
			}
			
			return entry;
		} else if (item.type === 'bucket') {
			const entry: YamlBucketEntry = {
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
	 * Creates empty config file if it doesn't exist
	 */
	public static loadConfig(): WorkbenchConfig | undefined {
		ui.logToOutput('ConfigManager.loadConfig Started');
		
		try {
			const configPath = this.getConfigPath();
			ui.logToOutput(`ConfigManager: Using config path: ${configPath}`);

			if (!fs.existsSync(configPath)) {
				ui.logToOutput('ConfigManager: Config file not found, creating empty one');
				this.saveConfig([]); // Create empty config
				return { BucketList: [], ShortcutList: [], Tree: [] };
			}
			
			const fileContents = fs.readFileSync(configPath, 'utf8');
			const yamlConfig = yaml.load(fileContents) as YamlConfig;

			// Convert YAML format to internal format
			const config = this.yamlToInternal(yamlConfig);

			ui.logToOutput(`ConfigManager: Config loaded successfully. Tree items: ${config.Tree?.length || 0}`);
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
	public static async saveConfig(tree: ConfigItem[]): Promise<boolean> {
		ui.logToOutput('ConfigManager.saveConfig Started');
		
		try {
			const configPath = this.getConfigPath();

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
			
			return true;

		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			ui.logToOutput('ConfigManager.saveConfig Error !!!', err);
			ui.showErrorMessage('Error saving aws-workbench.yaml configuration', err);
			return false;
		}
	}

	/**
	 * Export current state to YAML config file (Manual export)
	 */
	public static async exportToConfig(tree: ConfigItem[]): Promise<void> {
		// Just call saveConfig as it now handles the logic
		await this.saveConfig(tree);
		ui.showInfoMessage(`Configuration saved to ${this.CONFIG_FILENAME}`);
	}

	/**
	 * Check if config file exists
	 */
	public static hasConfigFile(): boolean {
		try {
			const configPath = this.getConfigPath();
			return fs.existsSync(configPath);
		} catch {
			return false;
		}
	}

	/**
	 * Get config file path
	 */
	public static getConfigFilePath(): string | undefined {
		try {
			return this.getConfigPath();
		} catch {
			return undefined;
		}
	}
}
