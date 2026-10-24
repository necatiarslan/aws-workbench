"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAwsProfileList = GetAwsProfileList;
exports.GetAwsProfiles = GetAwsProfiles;
async function GetAwsProfileList() {
    let result = [];
    try {
        let profileData = await GetAwsProfiles();
        result = Object.keys(profileData);
        return result;
    }
    catch (error) {
        return result;
    }
}
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
async function GetAwsProfiles() {
    try {
        const config = await (0, shared_ini_file_loader_1.loadSharedConfigFiles)();
        return config.credentialsFile;
    }
    catch (err) {
        console.error("Error loading AWS profiles:", err);
        throw err;
    }
}
//# sourceMappingURL=API.js.map