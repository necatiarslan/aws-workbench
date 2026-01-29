"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamPolicyAttachmentNode = void 0;
const NodeBase_1 = require("../tree/NodeBase");
class IamPolicyAttachmentNode extends NodeBase_1.NodeBase {
    constructor(Label, parent) {
        super(Label, parent);
        this.SetContextValue();
    }
    EntityType = ""; // 'User', 'Group', or 'Role'
    EntityName = "";
    EntityId = "";
    // Override to set icon based on entity type
    get Icon() {
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
    set Icon(value) {
        // Icon is determined by EntityType, so this is a no-op
    }
}
exports.IamPolicyAttachmentNode = IamPolicyAttachmentNode;
//# sourceMappingURL=IamPolicyAttachmentNode.js.map