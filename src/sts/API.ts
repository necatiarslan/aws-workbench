import { Session } from '../common/Session';


import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

export async function GetSTSClient(region: string) {
  const credentials = await Session.Current.GetCredentials();
  const iamClient = new STSClient(
    {
      region,
      credentials,
      endpoint: Session.Current.AwsEndPoint,
    }
  );
  return iamClient;
}