import { TreeItemBase } from "./TreeItemBase";

export abstract class ServiceBase {


    abstract addResource(treeItem?: TreeItemBase): void;
}