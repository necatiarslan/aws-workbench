"use strict";
/**
 * Types for Workflow Studio View
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = exports.MessageType = exports.WorkflowMode = void 0;
var WorkflowMode;
(function (WorkflowMode) {
    WorkflowMode["Editable"] = "editable";
    WorkflowMode["Readonly"] = "readonly";
})(WorkflowMode || (exports.WorkflowMode = WorkflowMode = {}));
var MessageType;
(function (MessageType) {
    MessageType["REQUEST"] = "REQUEST";
    MessageType["RESPONSE"] = "RESPONSE";
    MessageType["BROADCAST"] = "BROADCAST";
})(MessageType || (exports.MessageType = MessageType = {}));
var Command;
(function (Command) {
    Command["INIT"] = "INIT";
    Command["CLOSE"] = "CLOSE";
})(Command || (exports.Command = Command = {}));
//# sourceMappingURL=types.js.map