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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamRoleNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = __importStar(require("vscode"));
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const IamRolePoliciesGroupNode_1 = require("./IamRolePoliciesGroupNode");
const IamRoleTrustGroupNode_1 = require("./IamRoleTrustGroupNode");
const IamTagsGroupNode_1 = require("./IamTagsGroupNode");
const IamRoleInfoGroupNode_1 = require("./IamRoleInfoGroupNode");
class IamRoleNode extends NodeBase_1.NodeBase {
    constructor(RoleName, parent) {
        super(RoleName, parent);
        this.DefaultIcon = "shield";
        this.DefaultIconColor = "charts.blue";
        this.SetIcon();
        this.RoleName = RoleName;
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Attach event handlers
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeInfo.subscribe(() => this.handleNodeInfo());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    RoleName = "";
    Region = "";
    Arn = "";
    async LoadDefaultChildren() {
        new IamRoleInfoGroupNode_1.IamRoleInfoGroupNode("Info", this);
        new IamRolePoliciesGroupNode_1.IamRolePoliciesGroupNode("Policies", this);
        new IamRoleTrustGroupNode_1.IamRoleTrustGroupNode("Trust Relationships", this);
        new IamTagsGroupNode_1.IamTagsGroupNode("Tags", this);
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async handleNodeInfo() {
        ui.logToOutput('IamRoleNode.NodeInfo Started');
        if (!this.RoleName || !this.Region) {
            ui.showWarningMessage('IAM Role or region is not set.');
            return;
        }
        if (this.IsWorking) {
            return;
        }
        this.StartWorking();
        try {
            const result = await api.GetIamRole(this.Region, this.RoleName);
            if (result.isSuccessful && result.result.Role) {
                const jsonContent = JSON.stringify(result.result.Role, null, 2);
                const document = await vscode.workspace.openTextDocument({
                    content: jsonContent,
                    language: 'json'
                });
                await vscode.window.showTextDocument(document);
            }
            else {
                ui.showWarningMessage('Failed to load IAM Role details');
            }
        }
        catch (error) {
            ui.logToOutput('IamRoleNode.NodeInfo Error !!!', error);
            ui.showErrorMessage('Failed to open IAM Role details', error);
        }
        this.StopWorking();
    }
}
exports.IamRoleNode = IamRoleNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], IamRoleNode.prototype, "RoleName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], IamRoleNode.prototype, "Region", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], IamRoleNode.prototype, "Arn", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('IamRoleNode', IamRoleNode);
//# sourceMappingURL=IamRoleNode.js.map