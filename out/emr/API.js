"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmrClient = GetEmrClient;
exports.GetEmrClusterList = GetEmrClusterList;
exports.GetEmrCluster = GetEmrCluster;
exports.GetEmrClusterSteps = GetEmrClusterSteps;
exports.GetEmrClusterBootstrapActions = GetEmrClusterBootstrapActions;
const client_emr_1 = require("@aws-sdk/client-emr");
const MethodResult_1 = require("../common/MethodResult");
const Session_1 = require("../common/Session");
const ui = __importStar(require("../common/UI"));
const ALL_CLUSTER_STATES = [
    "STARTING",
    "BOOTSTRAPPING",
    "RUNNING",
    "WAITING",
    "TERMINATING",
    "TERMINATED",
    "TERMINATED_WITH_ERRORS",
];
async function GetEmrClient(region) {
    const credentials = await Session_1.Session.Current.GetCredentials();
    return new client_emr_1.EMRClient({
        region,
        credentials,
        endpoint: Session_1.Session.Current.AwsEndPoint,
    });
}
async function GetEmrClusterList(region, searchKey) {
    const result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const emr = await GetEmrClient(region);
        let marker = undefined;
        const normalizedSearchKey = searchKey.trim().toLowerCase();
        do {
            const command = new client_emr_1.ListClustersCommand({
                ClusterStates: ALL_CLUSTER_STATES,
                Marker: marker,
            });
            const response = await emr.send(command);
            for (const cluster of response.Clusters ?? []) {
                const clusterName = (cluster.Name ?? "").toLowerCase();
                if (clusterName.includes(normalizedSearchKey)) {
                    result.result.push(cluster);
                }
            }
            marker = response.Marker;
        } while (marker);
        result.result.sort((a, b) => {
            const aTime = a.Status?.Timeline?.CreationDateTime?.getTime() ?? 0;
            const bTime = b.Status?.Timeline?.CreationDateTime?.getTime() ?? 0;
            return bTime - aTime;
        });
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrClusterList Error !!!", error);
        ui.logToOutput("api.GetEmrClusterList Error !!!", error);
        return result;
    }
}
async function GetEmrCluster(region, clusterId) {
    const result = new MethodResult_1.MethodResult();
    try {
        const emr = await GetEmrClient(region);
        const command = new client_emr_1.DescribeClusterCommand({ ClusterId: clusterId });
        const response = await emr.send(command);
        result.result = response.Cluster;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrCluster Error !!!", error);
        ui.logToOutput("api.GetEmrCluster Error !!!", error);
        return result;
    }
}
async function GetEmrClusterSteps(region, clusterId) {
    const result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const emr = await GetEmrClient(region);
        let marker = undefined;
        do {
            const command = new client_emr_1.ListStepsCommand({
                ClusterId: clusterId,
                Marker: marker,
            });
            const response = await emr.send(command);
            if (response.Steps) {
                result.result.push(...response.Steps);
            }
            marker = response.Marker;
        } while (marker);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrClusterSteps Error !!!", error);
        ui.logToOutput("api.GetEmrClusterSteps Error !!!", error);
        return result;
    }
}
async function GetEmrClusterBootstrapActions(region, clusterId) {
    const result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const emr = await GetEmrClient(region);
        let marker = undefined;
        do {
            const command = new client_emr_1.ListBootstrapActionsCommand({
                ClusterId: clusterId,
                Marker: marker,
            });
            const response = await emr.send(command);
            if (response.BootstrapActions) {
                result.result.push(...response.BootstrapActions);
            }
            marker = response.Marker;
        } while (marker);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrClusterBootstrapActions Error !!!", error);
        ui.logToOutput("api.GetEmrClusterBootstrapActions Error !!!", error);
        return result;
    }
}
//# sourceMappingURL=API.js.map