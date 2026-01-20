"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const ServiceBase_1 = require("../../tree/ServiceBase");
const vscode = require("vscode");
const S3BucketNode_1 = require("./S3BucketNode");
const TreeState_1 = require("../../tree/TreeState");
const Telemetry_1 = require("../../common/Telemetry");
const api = require("./API");
const ui = require("../../common/UI");
class S3Service extends ServiceBase_1.ServiceBase {
    static Current;
    constructor() {
        super();
        S3Service.Current = this;
    }
    async Add(node) {
        Telemetry_1.Telemetry.Current?.send("S3TreeView.AddBucket");
        ui.logToOutput('S3TreeView.AddBucket Started');
        let selectedBucketName = await vscode.window.showInputBox({ placeHolder: 'Enter Bucket Name / Search Text' });
        if (selectedBucketName === undefined) {
            return;
        }
        var resultBucket = await api.GetBucketList(selectedBucketName);
        if (!resultBucket.isSuccessful) {
            return;
        }
        let selectedBucketList = await vscode.window.showQuickPick(resultBucket.result, { canPickMany: true, placeHolder: 'Select Bucket(s)' });
        if (!selectedBucketList || selectedBucketList.length === 0) {
            return;
        }
        for (var selectedBucket of selectedBucketList) {
            let bucketNode = new S3BucketNode_1.S3BucketNode(selectedBucket, "", node);
        }
        TreeState_1.TreeState.save();
    }
}
exports.S3Service = S3Service;
//# sourceMappingURL=S3Service.js.map