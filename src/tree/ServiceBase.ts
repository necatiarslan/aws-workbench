import { NodeBase } from "./NodeBase";

export abstract class ServiceBase {


    abstract addResource(node?: NodeBase): void;
}