import { NodeBase } from '../tree/NodeBase';
import * as vscode from 'vscode';
import { GlueJobNode } from './GlueJobNode';
import { GlueInfoNode } from './GlueInfoNode';
import * as ui from '../common/UI';

export class GlueInfoGroupNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) {
        super(Label, parent);
        this.Icon = "info";
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        
        this.OnNodeLoadChildren.subscribe(() => this.handleLoadChildren());
        
        this.SetContextValue();
    }

    private getParentJob(): GlueJobNode | undefined {
        let current = this.Parent;
        while (current) {
            if (current instanceof GlueJobNode) {
                return current;
            }
            current = current.Parent;
        }
        return undefined;
    }

    private async handleLoadChildren(): Promise<void> {
        ui.logToOutput('GlueInfoGroupNode.handleLoadChildren Started');

        const job = this.getParentJob();
        if (!job) {
            ui.showWarningMessage('Parent job node not found');
            return;
        }

        // Clear existing children
        this.Children.length = 0;

        this.StartWorking();

        try {
            const config = await job.JobConfig;
            if (!config) {
                ui.showWarningMessage('Failed to load job configuration');
                this.StopWorking();
                return;
            }

            // Create info nodes for key properties
            if (config.Name) {
                new GlueInfoNode("Name", config.Name, this);
            }
            if (config.Role) {
                new GlueInfoNode("Role", config.Role, this);
            }
            if (config.Command?.Name) {
                new GlueInfoNode("Type", config.Command.Name, this);
            }
            if (config.Command?.PythonVersion) {
                new GlueInfoNode("Python Version", config.Command.PythonVersion, this);
            }
            if (config.GlueVersion) {
                new GlueInfoNode("Glue Version", config.GlueVersion, this);
            }
            if (config.MaxRetries !== undefined) {
                new GlueInfoNode("Max Retries", String(config.MaxRetries), this);
            }
            if (config.Timeout !== undefined) {
                new GlueInfoNode("Timeout (min)", String(config.Timeout), this);
            }
            if (config.MaxCapacity !== undefined) {
                new GlueInfoNode("Max Capacity", String(config.MaxCapacity), this);
            }
            if (config.NumberOfWorkers !== undefined) {
                new GlueInfoNode("Workers", String(config.NumberOfWorkers), this);
            }
            if (config.WorkerType) {
                new GlueInfoNode("Worker Type", config.WorkerType, this);
            }
            if (config.Command?.ScriptLocation) {
                new GlueInfoNode("Script Location", config.Command.ScriptLocation, this);
            }
            if (config.CreatedOn) {
                new GlueInfoNode("Created", config.CreatedOn.toISOString(), this);
            }
            if (config.LastModifiedOn) {
                new GlueInfoNode("Last Modified", config.LastModifiedOn.toISOString(), this);
            }

        } catch (error: any) {
            ui.logToOutput('GlueInfoGroupNode.handleLoadChildren Error !!!', error);
            ui.showErrorMessage('Failed to load job info', error);
        } finally {
            this.StopWorking();
        }
    }
}
