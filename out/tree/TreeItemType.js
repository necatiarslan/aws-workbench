"use strict";
/* eslint-disable @typescript-eslint/naming-convention */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = void 0;
/**
 * Consolidated TreeItemType enum for all AWS services in the workbench.
 * Each type is prefixed with the service name for clarity and to avoid conflicts.
 */
var TreeItemType;
(function (TreeItemType) {
    // S3 Service
    TreeItemType[TreeItemType["S3Bucket"] = 1] = "S3Bucket";
    TreeItemType[TreeItemType["S3Shortcut"] = 2] = "S3Shortcut";
    // Lambda Service
    TreeItemType[TreeItemType["LambdaFunction"] = 100] = "LambdaFunction";
    TreeItemType[TreeItemType["LambdaCode"] = 101] = "LambdaCode";
    TreeItemType[TreeItemType["LambdaLogGroup"] = 102] = "LambdaLogGroup";
    TreeItemType[TreeItemType["LambdaLogStream"] = 103] = "LambdaLogStream";
    TreeItemType[TreeItemType["LambdaTriggerGroup"] = 104] = "LambdaTriggerGroup";
    TreeItemType[TreeItemType["LambdaTriggerSavedPayload"] = 105] = "LambdaTriggerSavedPayload";
    TreeItemType[TreeItemType["LambdaCodePath"] = 106] = "LambdaCodePath";
    TreeItemType[TreeItemType["LambdaTriggerNoPayload"] = 107] = "LambdaTriggerNoPayload";
    TreeItemType[TreeItemType["LambdaTriggerWithPayload"] = 108] = "LambdaTriggerWithPayload";
    TreeItemType[TreeItemType["LambdaTriggerFilePayload"] = 109] = "LambdaTriggerFilePayload";
    TreeItemType[TreeItemType["LambdaResponsePayload"] = 110] = "LambdaResponsePayload";
    TreeItemType[TreeItemType["LambdaEnvironmentVariableGroup"] = 111] = "LambdaEnvironmentVariableGroup";
    TreeItemType[TreeItemType["LambdaEnvironmentVariable"] = 112] = "LambdaEnvironmentVariable";
    TreeItemType[TreeItemType["LambdaTagsGroup"] = 113] = "LambdaTagsGroup";
    TreeItemType[TreeItemType["LambdaTag"] = 114] = "LambdaTag";
    TreeItemType[TreeItemType["LambdaInfoGroup"] = 115] = "LambdaInfoGroup";
    TreeItemType[TreeItemType["LambdaInfoItem"] = 116] = "LambdaInfoItem";
    // SQS Service
    TreeItemType[TreeItemType["SQSQueue"] = 200] = "SQSQueue";
    TreeItemType[TreeItemType["SQSPublishGroup"] = 201] = "SQSPublishGroup";
    TreeItemType[TreeItemType["SQSPublishAdhoc"] = 202] = "SQSPublishAdhoc";
    TreeItemType[TreeItemType["SQSPublishFile"] = 203] = "SQSPublishFile";
    TreeItemType[TreeItemType["SQSReceiveGroup"] = 204] = "SQSReceiveGroup";
    TreeItemType[TreeItemType["SQSReceivedMessage"] = 205] = "SQSReceivedMessage";
    TreeItemType[TreeItemType["SQSDetailGroup"] = 206] = "SQSDetailGroup";
    TreeItemType[TreeItemType["SQSDetailItem"] = 207] = "SQSDetailItem";
    TreeItemType[TreeItemType["SQSPolicy"] = 208] = "SQSPolicy";
    TreeItemType[TreeItemType["SQSDeletedMessage"] = 209] = "SQSDeletedMessage";
    TreeItemType[TreeItemType["SQSOther"] = 299] = "SQSOther";
    // IAM Service
    TreeItemType[TreeItemType["IAMRole"] = 300] = "IAMRole";
    TreeItemType[TreeItemType["IAMPermissionsGroup"] = 301] = "IAMPermissionsGroup";
    TreeItemType[TreeItemType["IAMPermission"] = 302] = "IAMPermission";
    TreeItemType[TreeItemType["IAMTrustRelationshipsGroup"] = 303] = "IAMTrustRelationshipsGroup";
    TreeItemType[TreeItemType["IAMTrustRelationship"] = 304] = "IAMTrustRelationship";
    TreeItemType[TreeItemType["IAMTagsGroup"] = 305] = "IAMTagsGroup";
    TreeItemType[TreeItemType["IAMTag"] = 306] = "IAMTag";
    TreeItemType[TreeItemType["IAMInfoGroup"] = 307] = "IAMInfoGroup";
    TreeItemType[TreeItemType["IAMInfoItem"] = 308] = "IAMInfoItem";
    // SNS Service
    TreeItemType[TreeItemType["SNSTopic"] = 400] = "SNSTopic";
    TreeItemType[TreeItemType["SNSPublishGroup"] = 401] = "SNSPublishGroup";
    TreeItemType[TreeItemType["SNSPublishAdhoc"] = 402] = "SNSPublishAdhoc";
    TreeItemType[TreeItemType["SNSPublishFile"] = 403] = "SNSPublishFile";
    TreeItemType[TreeItemType["SNSSubscriptionGroup"] = 404] = "SNSSubscriptionGroup";
    TreeItemType[TreeItemType["SNSSubscription"] = 405] = "SNSSubscription";
    TreeItemType[TreeItemType["SNSOther"] = 499] = "SNSOther";
    // DynamoDB Service
    TreeItemType[TreeItemType["DynamoDBTable"] = 500] = "DynamoDBTable";
    TreeItemType[TreeItemType["DynamoDBCode"] = 501] = "DynamoDBCode";
    TreeItemType[TreeItemType["DynamoDBLogGroup"] = 502] = "DynamoDBLogGroup";
    TreeItemType[TreeItemType["DynamoDBLogStream"] = 503] = "DynamoDBLogStream";
    TreeItemType[TreeItemType["DynamoDBTriggerGroup"] = 504] = "DynamoDBTriggerGroup";
    TreeItemType[TreeItemType["DynamoDBTriggerSavedPayload"] = 505] = "DynamoDBTriggerSavedPayload";
    TreeItemType[TreeItemType["DynamoDBCodePath"] = 506] = "DynamoDBCodePath";
    TreeItemType[TreeItemType["DynamoDBTriggerNoPayload"] = 507] = "DynamoDBTriggerNoPayload";
    TreeItemType[TreeItemType["DynamoDBTriggerWithPayload"] = 508] = "DynamoDBTriggerWithPayload";
    TreeItemType[TreeItemType["DynamoDBTriggerFilePayload"] = 509] = "DynamoDBTriggerFilePayload";
    TreeItemType[TreeItemType["DynamoDBResponsePayload"] = 510] = "DynamoDBResponsePayload";
    TreeItemType[TreeItemType["DynamoDBEnvironmentVariableGroup"] = 511] = "DynamoDBEnvironmentVariableGroup";
    TreeItemType[TreeItemType["DynamoDBEnvironmentVariable"] = 512] = "DynamoDBEnvironmentVariable";
    TreeItemType[TreeItemType["DynamoDBPrimaryKey"] = 513] = "DynamoDBPrimaryKey";
    TreeItemType[TreeItemType["DynamoDBPartitionKey"] = 514] = "DynamoDBPartitionKey";
    TreeItemType[TreeItemType["DynamoDBSortKey"] = 515] = "DynamoDBSortKey";
    TreeItemType[TreeItemType["DynamoDBCapacity"] = 516] = "DynamoDBCapacity";
    TreeItemType[TreeItemType["DynamoDBTableInfo"] = 517] = "DynamoDBTableInfo";
    TreeItemType[TreeItemType["DynamoDBIndexes"] = 518] = "DynamoDBIndexes";
    TreeItemType[TreeItemType["DynamoDBIndex"] = 519] = "DynamoDBIndex";
    TreeItemType[TreeItemType["DynamoDBTableSize"] = 520] = "DynamoDBTableSize";
    TreeItemType[TreeItemType["DynamoDBItemCount"] = 521] = "DynamoDBItemCount";
    TreeItemType[TreeItemType["DynamoDBTableClass"] = 522] = "DynamoDBTableClass";
    TreeItemType[TreeItemType["DynamoDBTableStatus"] = 523] = "DynamoDBTableStatus";
    TreeItemType[TreeItemType["DynamoDBReadCapacity"] = 524] = "DynamoDBReadCapacity";
    TreeItemType[TreeItemType["DynamoDBWriteCapacity"] = 525] = "DynamoDBWriteCapacity";
    TreeItemType[TreeItemType["DynamoDBTags"] = 526] = "DynamoDBTags";
    TreeItemType[TreeItemType["DynamoDBTagItem"] = 527] = "DynamoDBTagItem";
    TreeItemType[TreeItemType["DynamoDBCapacityExplanation"] = 528] = "DynamoDBCapacityExplanation";
    TreeItemType[TreeItemType["DynamoDBTableArn"] = 529] = "DynamoDBTableArn";
    TreeItemType[TreeItemType["DynamoDBAverageItemSize"] = 530] = "DynamoDBAverageItemSize";
    // Step Functions Service
    TreeItemType[TreeItemType["StepFunctionsStateMachine"] = 600] = "StepFunctionsStateMachine";
    TreeItemType[TreeItemType["StepFunctionsCode"] = 601] = "StepFunctionsCode";
    TreeItemType[TreeItemType["StepFunctionsLogGroup"] = 602] = "StepFunctionsLogGroup";
    TreeItemType[TreeItemType["StepFunctionsLogStream"] = 603] = "StepFunctionsLogStream";
    TreeItemType[TreeItemType["StepFunctionsTriggerGroup"] = 604] = "StepFunctionsTriggerGroup";
    TreeItemType[TreeItemType["StepFunctionsTriggerSavedPayload"] = 605] = "StepFunctionsTriggerSavedPayload";
    TreeItemType[TreeItemType["StepFunctionsCodePath"] = 606] = "StepFunctionsCodePath";
    TreeItemType[TreeItemType["StepFunctionsTriggerNoPayload"] = 607] = "StepFunctionsTriggerNoPayload";
    TreeItemType[TreeItemType["StepFunctionsTriggerWithPayload"] = 608] = "StepFunctionsTriggerWithPayload";
    TreeItemType[TreeItemType["StepFunctionsTriggerFilePayload"] = 609] = "StepFunctionsTriggerFilePayload";
    TreeItemType[TreeItemType["StepFunctionsResponsePayload"] = 610] = "StepFunctionsResponsePayload";
    TreeItemType[TreeItemType["StepFunctionsEnvironmentVariableGroup"] = 611] = "StepFunctionsEnvironmentVariableGroup";
    TreeItemType[TreeItemType["StepFunctionsEnvironmentVariable"] = 612] = "StepFunctionsEnvironmentVariable";
    TreeItemType[TreeItemType["StepFunctionsExecutionGroup"] = 613] = "StepFunctionsExecutionGroup";
    TreeItemType[TreeItemType["StepFunctionsExecution"] = 614] = "StepFunctionsExecution";
    TreeItemType[TreeItemType["StepFunctionsSuccessfulExecutionGroup"] = 615] = "StepFunctionsSuccessfulExecutionGroup";
    TreeItemType[TreeItemType["StepFunctionsFailedExecutionGroup"] = 616] = "StepFunctionsFailedExecutionGroup";
    TreeItemType[TreeItemType["StepFunctionsRunningExecutionGroup"] = 617] = "StepFunctionsRunningExecutionGroup";
    // Glue Service
    TreeItemType[TreeItemType["GlueJob"] = 700] = "GlueJob";
    TreeItemType[TreeItemType["GlueRunGroup"] = 701] = "GlueRunGroup";
    TreeItemType[TreeItemType["GlueLogGroup"] = 702] = "GlueLogGroup";
    TreeItemType[TreeItemType["GlueLogStream"] = 703] = "GlueLogStream";
    TreeItemType[TreeItemType["GlueRun"] = 704] = "GlueRun";
    TreeItemType[TreeItemType["GlueDetail"] = 705] = "GlueDetail";
    TreeItemType[TreeItemType["GlueArguments"] = 706] = "GlueArguments";
    TreeItemType[TreeItemType["GlueInfo"] = 707] = "GlueInfo";
    // CloudWatch Service
    TreeItemType[TreeItemType["CloudWatchRegion"] = 800] = "CloudWatchRegion";
    TreeItemType[TreeItemType["CloudWatchLogGroup"] = 801] = "CloudWatchLogGroup";
    TreeItemType[TreeItemType["CloudWatchLogStream"] = 802] = "CloudWatchLogStream";
    TreeItemType[TreeItemType["CloudWatchInfo"] = 803] = "CloudWatchInfo";
    TreeItemType[TreeItemType["CloudWatchInfoDetail"] = 804] = "CloudWatchInfoDetail";
    TreeItemType[TreeItemType["CloudWatchToday"] = 805] = "CloudWatchToday";
    TreeItemType[TreeItemType["CloudWatchYesterday"] = 806] = "CloudWatchYesterday";
    TreeItemType[TreeItemType["CloudWatchHistory"] = 807] = "CloudWatchHistory";
    TreeItemType[TreeItemType["CloudWatchRefreshAction"] = 808] = "CloudWatchRefreshAction";
})(TreeItemType || (exports.TreeItemType = TreeItemType = {}));
//# sourceMappingURL=TreeItemType.js.map