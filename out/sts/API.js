"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSTSClient = GetSTSClient;
const Session_1 = require("../common/Session");
const client_sts_1 = require("@aws-sdk/client-sts");
async function GetSTSClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    const iamClient = new client_sts_1.STSClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
    return iamClient;
}
//# sourceMappingURL=API.js.map