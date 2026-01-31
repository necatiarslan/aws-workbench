import { NodeBase } from "./NodeBase";
import { TreeState } from "../tree/TreeState";


export abstract class ServiceBase {

    public static Current: ServiceBase;

    abstract Add(node?: NodeBase): void;

    public TreeSave(): void {
        TreeState.save();
    }
}