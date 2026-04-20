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
exports.IamRoleInfoGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const IamInfoNode_1 = require("./IamInfoNode");
class IamRoleInfoGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "info";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamRoleInfoGroupNode.NodeRefresh Started');
        // Get the parent IAM Role node
        const roleNode = this.Parent;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamRoleInfoGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get role details
        const result = await api.GetIamRole(roleNode.Region, roleNode.RoleName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetIamRole Error !!!', result.error);
            ui.showErrorMessage('Get IAM Role Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add info items as children
        const role = result.result.Role;
        if (role) {
            const infoItems = [
                { key: 'RoleName', value: role.RoleName || 'N/A' },
                { key: 'RoleId', value: role.RoleId || 'N/A' },
                { key: 'Arn', value: role.Arn || 'N/A' },
                { key: 'CreateDate', value: role.CreateDate?.toISOString() || 'N/A' },
                { key: 'Path', value: role.Path || 'N/A' },
                { key: 'MaxSessionDuration', value: role.MaxSessionDuration?.toString() + ' seconds' || 'N/A' },
                { key: 'Description', value: role.Description || 'N/A' }
            ];
            for (const item of infoItems) {
                const infoNode = new IamInfoNode_1.IamInfoNode(item.key, item.value, this);
                infoNode.InfoKey = item.key;
                infoNode.InfoValue = item.value;
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.IamRoleInfoGroupNode = IamRoleInfoGroupNode;
//# sourceMappingURL=IamRoleInfoGroupNode.js.map