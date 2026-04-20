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
exports.LambdaService = void 0;
const ServiceBase_1 = require("../tree/ServiceBase");
const vscode = __importStar(require("vscode"));
const LambdaFunctionNode_1 = require("./LambdaFunctionNode");
const api = __importStar(require("./API"));
const ui = __importStar(require("../common/UI"));
const Session_1 = require("../common/Session");
class LambdaService extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        LambdaService.Current = this;
    }
    async Add(node) {
        ui.logToOutput('LambdaService..Add Started');
        let selectedRegion = await vscode.window.showInputBox({ value: Session_1.Session.Current.AwsRegion, placeHolder: 'Region Name Exp: us-east-1' });
        if (!selectedRegion) {
            return;
        }
        const lambdaName = await vscode.window.showInputBox({ placeHolder: 'Lambda Function Name Filter (Optional)' });
        if (lambdaName === undefined) {
            return;
        }
        var resultLambda = await api.GetLambdaList(selectedRegion, lambdaName);
        if (!resultLambda.isSuccessful) {
            return;
        }
        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, { canPickMany: true, placeHolder: 'Select Lambda Function' });
        if (!selectedLambdaList || selectedLambdaList.length === 0) {
            return;
        }
        for (var selectedLambda of selectedLambdaList) {
            new LambdaFunctionNode_1.LambdaFunctionNode(selectedLambda, node).Region = selectedRegion;
        }
        this.TreeSave();
    }
}
exports.LambdaService = LambdaService;
//# sourceMappingURL=LambdaService.js.map