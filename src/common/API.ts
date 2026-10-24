import { ParsedIniData } from "@aws-sdk/types";

export async function GetAwsProfileList(): Promise<string[]> {
  let result:string[] = [];
  try {
    let profileData = await GetAwsProfiles();
    result = Object.keys(profileData);
    return result;
  } catch (error:any) 
  {
    return result;
  }
}

import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";

export async function GetAwsProfiles(): Promise<ParsedIniData> {
  try {
    const config = await loadSharedConfigFiles();
    return config.credentialsFile;
  } catch (err) {
    console.error("Error loading AWS profiles:", err);
    throw err;
  }
}
