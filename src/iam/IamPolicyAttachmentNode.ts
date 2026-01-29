import { NodeBase } from '../tree/NodeBase';

export class IamPolicyAttachmentNode extends NodeBase {

    constructor(Label: string, parent?: NodeBase) 
    {
        super(Label, parent);
        
        this.SetContextValue();
    }

    public EntityType: string = "";  // 'User', 'Group', or 'Role'
    public EntityName: string = "";
    public EntityId: string = "";

    // Override to set icon based on entity type
    public get Icon(): string {
        switch (this.EntityType) {
            case 'User':
                return 'account';
            case 'Group':
                return 'organization';
            case 'Role':
                return 'shield';
            default:
                return 'circle-filled';
        }
    }

    public set Icon(value: string) {
        // Icon is determined by EntityType, so this is a no-op
    }

}
