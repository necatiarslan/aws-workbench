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
exports.EmrService = void 0;
const vscode = __importStar(require("vscode"));
const Session_1 = require("../common/Session");
const ui = __importStar(require("../common/UI"));
const ServiceBase_1 = require("../tree/ServiceBase");
const EmrNode_1 = require("./EmrNode");
class EmrService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        EmrService.Current = this;
    }
    async Add(node) {
        ui.logToOutput("EmrService.Add Started");
        const selectedRegion = await vscode.window.showInputBox({
            value: Session_1.Session.Current.AwsRegion,
            placeHolder: "Region Name e.g., us-east-1",
        });
        if (!selectedRegion) {
            return;
        }
        const searchKey = await vscode.window.showInputBox({
            placeHolder: "Enter cluster search key (required)",
            value: "",
            validateInput: (value) => value.trim().length > 0 ? undefined : "Search key is required",
        });
        if (!searchKey) {
            return;
        }
        new EmrNode_1.EmrNode(`EMR: ${searchKey}`, node, selectedRegion, searchKey.trim());
        this.TreeSave();
    }
}
exports.EmrService = EmrService;
//# sourceMappingURL=EmrService.js.map