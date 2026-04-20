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
exports.S3BucketNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const S3Explorer_1 = require("./S3Explorer");
const S3BucketShortcutGroupNode_1 = require("./S3BucketShortcutGroupNode");
const S3TagsGroupNode_1 = require("./S3TagsGroupNode");
const S3InfoGroupNode_1 = require("./S3InfoGroupNode");
const S3BucketPolicyNode_1 = require("./S3BucketPolicyNode");
const S3LifecycleGroupNode_1 = require("./S3LifecycleGroupNode");
const S3LoggingGroupNode_1 = require("./S3LoggingGroupNode");
const S3NotificationGroupNode_1 = require("./S3NotificationGroupNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
class S3BucketNode extends NodeBase_1.NodeBase {
    constructor(BucketName, parent) {
        super(BucketName, parent);
        this.BucketName = BucketName;
        this.DefaultIcon = "s3-bucket";
        this.DefaultIconColor = "charts.orange";
        this.SetIcon();
        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        // Event subscriptions
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.LoadDefaultChildren();
        this.SetContextValue();
    }
    BucketName = "";
    Shortcuts = [];
    ShortcutGroupNode;
    _info = undefined;
    get Info() {
        return this.getInfo();
    }
    async getInfo() {
        if (!this._info) {
            const response = await api.GetBucket(this.BucketName);
            if (response.isSuccessful) {
                this._info = response.result;
            }
            else {
                ui.logToOutput('api.GetBucket Error !!!', response.error);
                ui.showErrorMessage('Get Bucket Error !!!', response.error);
            }
        }
        return this._info;
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    async LoadDefaultChildren() {
        this.ShortcutGroupNode = new S3BucketShortcutGroupNode_1.S3BucketShortcutGroupNode("Shortcuts", this);
        new S3InfoGroupNode_1.S3InfoGroupNode("Info", this);
        new S3BucketPolicyNode_1.S3BucketPolicyNode("Policy", this);
        new S3LifecycleGroupNode_1.S3LifecycleGroupNode("Lifecycle", this);
        new S3LoggingGroupNode_1.S3LoggingGroupNode("Logging", this);
        new S3NotificationGroupNode_1.S3NotificationGroupNode("Notifications", this);
        new S3TagsGroupNode_1.S3TagsGroupNode("Tags", this);
    }
    IsShortcutExists(key) {
        return this.Shortcuts.includes(key);
    }
    AddOrRemoveShortcut(key) {
        if (this.IsShortcutExists(key)) {
            this.RemoveShortcut(key);
        }
        else {
            this.AddShortcut(key);
        }
    }
    AddShortcut(key) {
        if (!this.IsShortcutExists(key)) {
            this.Shortcuts.push(key);
            this.ShortcutGroupNode?.NodeRefresh();
            this.TreeSave();
        }
    }
    RemoveShortcut(key) {
        this.Shortcuts = this.Shortcuts.filter(k => k !== key);
        this.ShortcutGroupNode?.NodeRefresh();
        this.TreeSave();
    }
    handleNodeView() {
        S3Explorer_1.S3Explorer.Render(this);
    }
}
exports.S3BucketNode = S3BucketNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], S3BucketNode.prototype, "BucketName", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", Array)
], S3BucketNode.prototype, "Shortcuts", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('S3BucketNode', S3BucketNode);
//# sourceMappingURL=S3BucketNode.js.map