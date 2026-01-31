"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceBase = void 0;
const TreeState_1 = require("../tree/TreeState");
class ServiceBase {
    static Current;
    TreeSave() {
        TreeState_1.TreeState.save();
    }
}
exports.ServiceBase = ServiceBase;
//# sourceMappingURL=ServiceBase.js.map