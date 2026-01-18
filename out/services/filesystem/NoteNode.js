"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteNode = void 0;
const NodeBase_1 = require("../../tree/NodeBase");
class NoteNode extends NodeBase_1.NodeBase {
    constructor(NoteTitle, parent) {
        super(NoteTitle, parent);
        this.Icon = "note";
        this.NoteTitle = NoteTitle;
    }
    NoteTitle = "";
    NoteContent = "";
}
exports.NoteNode = NoteNode;
//# sourceMappingURL=NoteNode.js.map