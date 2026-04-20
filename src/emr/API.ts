import {
    Cluster,
    ClusterState,
    ClusterSummary,
    Command as EmrCommand,
    DescribeClusterCommand,
    EMRClient,
    ListBootstrapActionsCommand,
    ListBootstrapActionsCommandOutput,
    ListClustersCommand,
    ListClustersCommandOutput,
    ListStepsCommand,
    ListStepsCommandOutput,
    StepSummary,
} from "@aws-sdk/client-emr";
import { MethodResult } from "../common/MethodResult";
import { Session } from "../common/Session";
import * as ui from "../common/UI";

const ALL_CLUSTER_STATES: ClusterState[] = [
    "STARTING",
    "BOOTSTRAPPING",
    "RUNNING",
    "WAITING",
    "TERMINATING",
    "TERMINATED",
    "TERMINATED_WITH_ERRORS",
];

export async function GetEmrClient(region: string): Promise<EMRClient> {
    const credentials = await Session.Current.GetCredentials();
    return new EMRClient({
        region,
        credentials,
        endpoint: Session.Current.AwsEndPoint,
    });
}

export async function GetEmrClusterList(region: string, searchKey: string): Promise<MethodResult<ClusterSummary[]>> {
    const result: MethodResult<ClusterSummary[]> = new MethodResult<ClusterSummary[]>();
    result.result = [];

    try {
        const emr = await GetEmrClient(region);
        let marker: string | undefined = undefined;
        const normalizedSearchKey = searchKey.trim().toLowerCase();

        do {
            const command: ListClustersCommand = new ListClustersCommand({
                ClusterStates: ALL_CLUSTER_STATES,
                Marker: marker,
            });
            const response: ListClustersCommandOutput = await emr.send(command);

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
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrClusterList Error !!!", error);
        ui.logToOutput("api.GetEmrClusterList Error !!!", error);
        return result;
    }
}

export async function GetEmrCluster(region: string, clusterId: string): Promise<MethodResult<Cluster | undefined>> {
    const result: MethodResult<Cluster | undefined> = new MethodResult<Cluster | undefined>();

    try {
        const emr = await GetEmrClient(region);
        const command = new DescribeClusterCommand({ ClusterId: clusterId });
        const response = await emr.send(command);

        result.result = response.Cluster;
        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrCluster Error !!!", error);
        ui.logToOutput("api.GetEmrCluster Error !!!", error);
        return result;
    }
}

export async function GetEmrClusterSteps(region: string, clusterId: string): Promise<MethodResult<StepSummary[]>> {
    const result: MethodResult<StepSummary[]> = new MethodResult<StepSummary[]>();
    result.result = [];

    try {
        const emr = await GetEmrClient(region);
        let marker: string | undefined = undefined;

        do {
            const command: ListStepsCommand = new ListStepsCommand({
                ClusterId: clusterId,
                Marker: marker,
            });
            const response: ListStepsCommandOutput = await emr.send(command);

            if (response.Steps) {
                result.result.push(...response.Steps);
            }

            marker = response.Marker;
        } while (marker);

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrClusterSteps Error !!!", error);
        ui.logToOutput("api.GetEmrClusterSteps Error !!!", error);
        return result;
    }
}

export async function GetEmrClusterBootstrapActions(region: string, clusterId: string): Promise<MethodResult<EmrCommand[]>> {
    const result: MethodResult<EmrCommand[]> = new MethodResult<EmrCommand[]>();
    result.result = [];

    try {
        const emr = await GetEmrClient(region);
        let marker: string | undefined = undefined;

        do {
            const command: ListBootstrapActionsCommand = new ListBootstrapActionsCommand({
                ClusterId: clusterId,
                Marker: marker,
            });
            const response: ListBootstrapActionsCommandOutput = await emr.send(command);

            if (response.BootstrapActions) {
                result.result.push(...response.BootstrapActions);
            }

            marker = response.Marker;
        } while (marker);

        result.isSuccessful = true;
        return result;
    } catch (error: any) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetEmrClusterBootstrapActions Error !!!", error);
        ui.logToOutput("api.GetEmrClusterBootstrapActions Error !!!", error);
        return result;
    }
}
