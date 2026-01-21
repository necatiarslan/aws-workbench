import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import * as vscode from 'vscode';
import { S3BucketNode } from "./S3BucketNode";
import { TreeState } from "../tree/TreeState";
import { Telemetry } from "../common/Telemetry";
import * as api from "./API";
import * as ui from "../common/UI";

export class S3Service extends ServiceBase {   

    public static Current: S3Service;

    constructor() {
        super();
        S3Service.Current = this;
    }

    public async Add(node: NodeBase): Promise<void> {
		Telemetry.Current?.send("S3TreeView.AddBucket");
		ui.logToOutput('S3TreeView.AddBucket Started');

		let selectedBucketName = await vscode.window.showInputBox({ placeHolder: 'Enter Bucket Name / Search Text' });
		if(selectedBucketName===undefined){ return; }

		var resultBucket = await api.GetBucketList(selectedBucketName);
		if(!resultBucket.isSuccessful){ return; }

		let selectedBucketList = await vscode.window.showQuickPick(resultBucket.result, {canPickMany:true, placeHolder: 'Select Bucket(s)'});
		if(!selectedBucketList || selectedBucketList.length===0){ return; }

		for(var selectedBucket of selectedBucketList)
		{
            let bucketNode = new S3BucketNode(selectedBucket, node);
		}

        TreeState.save();
    }
}