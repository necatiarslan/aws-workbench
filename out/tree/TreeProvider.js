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
exports.TreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const NodeBase_1 = require("./NodeBase");
class TreeProvider {
    static Current;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor() {
        TreeProvider.Current = this;
    }
    Refresh(node) {
        this._onDidChangeTreeData.fire(node?.Parent || undefined);
    }
    getTreeItem(node) {
        if (!node.IsOnNodeLoadedCalled) {
            node.NodeLoaded();
        }
        return node;
    }
    async getChildren(node) {
        if (node && !node.IsOnNodeLoadChildrenCalled) {
            await node?.NodeLoadChildren();
        }
        if (node && node.Children) {
            return node.Children.filter(child => child.IsVisible);
        }
        return NodeBase_1.NodeBase.RootNodes.filter(rootNode => rootNode.IsVisible);
    }
}
exports.TreeProvider = TreeProvider;
//# sourceMappingURL=TreeProvider.js.map