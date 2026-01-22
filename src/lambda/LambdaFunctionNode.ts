import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { ServiceHub } from '../tree/ServiceHub';
import { TreeState } from '../tree/TreeState';

export class LambdaFunctionNode extends NodeBase {

    constructor(FunctionName: string, parent?: NodeBase) 
    {
        super(FunctionName, parent);
        this.Icon = "lambda-function";
        this.FunctionName = FunctionName;

        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.EnableNodeRun = true;
        this.EnableNodeStop = true;
        this.EnableNodeAlias = true;
        this.EnableNodeInfo = true;
        this.SetContextValue();
    }

    @Serialize()
    public FunctionName: string = "";

    @Serialize()
    public Region: string = "";

    public async NodeAdd(): Promise<void> {

    }

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        //TODO: Implement Lambda function details viewing logic here
    }

    public async NodeEdit(): Promise<void> {
         
    }

    public NodeRun(): void {
        this.StartWorking();
        //TODO: Implement Lambda invocation logic here
        this.StopWorking();
    }

    public NodeStop(): void {
        //TODO: Implement Lambda function stop logic here
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
        //TODO: Implement Lambda function info display logic here
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('LambdaFunctionNode', LambdaFunctionNode);