import { NodeBase } from "./NodeBase";

export abstract class ServiceBase {

    public static Current: ServiceBase;

    abstract Add(node?: NodeBase): void;
}