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
exports.BashScriptNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
const Serialize_1 = require("../common/serialization/Serialize");
const NodeRegistry_1 = require("../common/serialization/NodeRegistry");
const vscode = __importStar(require("vscode"));
class BashScriptNode extends NodeBase_1.NodeBase {
    Title = "";
    Script = "";
    constructor(Title, parent) {
        super(Title, parent);
        this.DefaultIcon = "debug-console";
        this.DefaultIconColor = "charts.blue";
        this.SetIcon();
        this.Title = Title;
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
        this.OnNodeEdit.subscribe(() => this.handleNodeEdit());
        this.OnNodeRun.subscribe(() => this.handleNodeRun());
        this.EnableNodeAlias = true;
        this.SetContextValue();
    }
    handleNodeRemove() {
        this.Remove();
        this.TreeSave();
    }
    handleNodeView() {
        vscode.window.showInformationMessage(`${this.Title}`, { modal: true, detail: this.Script });
    }
    async handleNodeEdit() {
        let scriptContent = await vscode.window.showInputBox({ placeHolder: 'Script', value: this.Script });
        if (!scriptContent) {
            return;
        }
        this.Script = scriptContent;
        this.TreeSave();
    }
    handleNodeRun() {
        this.StartWorking();
        vscode.window.createTerminal(this.Title).sendText(this.Script);
        this.StopWorking();
    }
}
exports.BashScriptNode = BashScriptNode;
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], BashScriptNode.prototype, "Title", void 0);
__decorate([
    (0, Serialize_1.Serialize)(),
    __metadata("design:type", String)
], BashScriptNode.prototype, "Script", void 0);
// Register with NodeRegistry for deserialization
NodeRegistry_1.NodeRegistry.register('BashScriptNode', BashScriptNode);
//# sourceMappingURL=BashScriptNode.js.map