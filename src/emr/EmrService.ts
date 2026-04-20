import * as vscode from "vscode";
import { Session } from "../common/Session";
import * as ui from "../common/UI";
import { NodeBase } from "../tree/NodeBase";
import { ServiceBase } from "../tree/ServiceBase";
import { EmrNode } from "./EmrNode";

export class EmrService extends ServiceBase {

    public static Current: EmrService;

    constructor() {
        super();
        EmrService.Current = this;
    }

    public async Add(node?: NodeBase): Promise<void> {
        ui.logToOutput("EmrService.Add Started");

        const selectedRegion = await vscode.window.showInputBox({
            value: Session.Current.AwsRegion,
            placeHolder: "Region Name e.g., us-east-1",
        });
        if (!selectedRegion) { return; }

        const searchKey = await vscode.window.showInputBox({
            placeHolder: "Enter cluster search key (required)",
            value: "",
            validateInput: (value: string) => value.trim().length > 0 ? undefined : "Search key is required",
        });
        if (!searchKey) { return; }

        new EmrNode(`EMR: ${searchKey}`, node, selectedRegion, searchKey.trim());
        this.TreeSave();
    }
}
