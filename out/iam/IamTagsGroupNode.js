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
exports.IamTagsGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const IamTagNode_1 = require("./IamTagNode");
class IamTagsGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "tag";
        this.OnNodeAdd.subscribe(() => this.handleNodeAdd());
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeAdd() {
        ui.logToOutput('IamTagsGroupNode.NodeAdd Started');
        // Get the parent IAM Role node
        const roleNode = this.Parent;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagsGroupNode.NodeAdd - Parent IAM Role node not found');
            return;
        }
        // Prompt for tag key
        const tagKey = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Key (e.g., Environment)'
        });
        if (!tagKey) {
            return;
        }
        // Prompt for tag value (allow empty string, but not undefined/cancel)
        const tagValue = await vscode.window.showInputBox({
            placeHolder: 'Enter Tag Value (e.g., Production)'
        });
        if (tagValue === undefined) {
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Add the tag
        const addResult = await api.AddIamRoleTag(roleNode.Region, roleNode.RoleName, tagKey, tagValue);
        if (!addResult.isSuccessful) {
            ui.logToOutput('api.AddIamRoleTag Error !!!', addResult.error);
            ui.showErrorMessage('Add Tag Error !!!', addResult.error);
            this.StopWorking();
            return;
        }
        ui.showInfoMessage('Tag Added Successfully');
        // Reset working state before refresh
        this.StopWorking();
        await this.handleNodeRefresh();
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamTagsGroupNode.NodeRefresh Started');
        // Get the parent IAM Role node
        const roleNode = this.Parent;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamTagsGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }
        // if (this.IsWorking) {
        //     return;
        // }
        this.StartWorking();
        // Get tags
        const tagsResult = await api.GetIamRoleTags(roleNode.Region, roleNode.RoleName);
        if (!tagsResult.isSuccessful) {
            ui.logToOutput('api.GetIamRoleTags Error !!!', tagsResult.error);
            ui.showErrorMessage('Get IAM Role Tags Error !!!', tagsResult.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add tags as children
        if (tagsResult.result && tagsResult.result.Tags) {
            for (const tag of tagsResult.result.Tags) {
                const tagNode = new IamTagNode_1.IamTagNode(tag.Key || '', tag.Value || '', this);
                tagNode.Key = tag.Key || '';
                tagNode.Value = tag.Value || '';
            }
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.IamTagsGroupNode = IamTagsGroupNode;
//# sourceMappingURL=IamTagsGroupNode.js.map