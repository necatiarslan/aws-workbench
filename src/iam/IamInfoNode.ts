import { NodeBase } from '../tree/NodeBase';

export class IamInfoNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        this.Icon = "symbol-property";

        this.SetContextValue();
    }

    public Key: string = "";

    public Value: string = "";

}
