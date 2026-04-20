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
exports.IamRoleTrustGroupNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const IamRoleTrustNode_1 = require("./IamRoleTrustNode");
class IamRoleTrustGroupNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.Icon = "references";
        this.OnNodeRefresh.subscribe(() => this.handleNodeRefresh());
        this.OnNodeLoadChildren.subscribe(() => this.handleNodeRefresh());
        this.SetContextValue();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    async handleNodeRefresh() {
        ui.logToOutput('IamRoleTrustGroupNode.NodeRefresh Started');
        // Get the parent IAM Role node
        const roleNode = this.Parent;
        if (!roleNode || !roleNode.RoleName) {
            ui.logToOutput('IamRoleTrustGroupNode.NodeRefresh - Parent IAM Role node not found');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        // Get trust policy
        const result = await api.GetIamRoleTrustPolicy(roleNode.Region, roleNode.RoleName);
        if (!result.isSuccessful) {
            ui.logToOutput('api.GetIamRoleTrustPolicy Error !!!', result.error);
            ui.showErrorMessage('Get IAM Role Trust Policy Error !!!', result.error);
            this.StopWorking();
            return;
        }
        // Clear existing children
        this.Children = [];
        // Add trust relationships as children
        if (result.result && result.result.Statement) {
            for (const statement of result.result.Statement) {
                if (statement.Principal) {
                    // Handle Service principals
                    if (statement.Principal.Service) {
                        const services = Array.isArray(statement.Principal.Service)
                            ? statement.Principal.Service
                            : [statement.Principal.Service];
                        for (const service of services) {
                            const trustNode = new IamRoleTrustNode_1.IamRoleTrustNode(`Service: ${service}`, this);
                            trustNode.TrustEntity = service;
                            trustNode.TrustType = 'Service';
                            trustNode.Region = roleNode.Region;
                            trustNode.RoleName = roleNode.RoleName;
                        }
                    }
                    // Handle AWS account principals
                    if (statement.Principal.AWS) {
                        const awsPrincipals = Array.isArray(statement.Principal.AWS)
                            ? statement.Principal.AWS
                            : [statement.Principal.AWS];
                        for (const principal of awsPrincipals) {
                            const trustNode = new IamRoleTrustNode_1.IamRoleTrustNode(`AWS: ${principal}`, this);
                            trustNode.TrustEntity = principal;
                            trustNode.TrustType = 'AWS';
                            trustNode.Region = roleNode.Region;
                            trustNode.RoleName = roleNode.RoleName;
                        }
                    }
                    // Handle Federated principals
                    if (statement.Principal.Federated) {
                        const fedPrincipals = Array.isArray(statement.Principal.Federated)
                            ? statement.Principal.Federated
                            : [statement.Principal.Federated];
                        for (const principal of fedPrincipals) {
                            const trustNode = new IamRoleTrustNode_1.IamRoleTrustNode(`Federated: ${principal}`, this);
                            trustNode.TrustEntity = principal;
                            trustNode.TrustType = 'Federated';
                            trustNode.Region = roleNode.Region;
                            trustNode.RoleName = roleNode.RoleName;
                        }
                    }
                }
            }
        }
        if (this.Children.length > 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        this.StopWorking();
        this.RefreshTree();
    }
}
exports.IamRoleTrustGroupNode = IamRoleTrustGroupNode;
//# sourceMappingURL=IamRoleTrustGroupNode.js.map