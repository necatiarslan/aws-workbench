import { NodeBase } from '../tree/NodeBase';

export class LambdaInfoNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "info";

        this.SetContextValue();
    }

    public Key: string = "";

    public Value: string = "";

}
