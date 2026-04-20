install_vsce: 
    npm install -g vsce

build:
    vsce package
    mv *.vsix ./vsix/

publish:
    vsce publish

unzip_vsix:
    rm -rf ./unpacked_vsix
    mkdir -p ./unpacked_vsix
    latest=$(ls -t ./vsix/*.vsix 2>/dev/null | head -n1) && \
    if [ -z "$latest" ]; then echo "No .vsix files found in ./vsix"; exit 1; fi && \
    echo "Unzipping $latest into ./unpacked_vsix/" && \
    unzip "$latest" -d ./unpacked_vsix/

npm_outdated:
    npm outdated
    npx npm-check-updates

npm_update:
    npm update # update node_nodules and package-lock.json
    # these will not update packages in your package.json file

npm_reinstall:
    brew upgrade # upgrade homebrew
    brew install node # install the latest node version
    npm install -g npm@latest # upgrade to the latest version
    nvm alias default node # set the default node version
    nvm install node # install the latest node version

npm_doctor:
    node -v
    npm -v
    tsc -v
    npm doctor
    npm prune # remove unused dependencies
    npx depcheck # check dependencies
    npm-check # check dependencies
    
npm-install:
    rm -rf node_modules package-lock.json
    npm install
    npx tsc --noEmit

npm_rebuild:
    rm -rf node_modules
    npm install

# AWB1.eyJ2IjoxLCJlbWFpbCI6Im5lY2F0aWFAZ21haWwuY29tIn0.CHu12V2Q60P40nLSvQ0OcQqqcfk21Tf903-eebalv-AYCyFrgjBK_OJof9gk9-NyB3fTMGfjqtCJYLOHEY-GBw

# LocalStack / AWS CLI defaults
localstack-endpoint := "http://localhost:4566"
aws-region := "us-east-1"
aws-account := "000000000000"

s3-bucket := "my-bucket"
sqs-queue := "my-queue"
dynamodb-table := "my-table"
lambda-name := "my-lambda"
stepfn-name := "my_step_function"
log-group := "my-log-group"
log-stream := "my-log-stream"

# LocalStack lifecycle
localstack-start:
    localstack start

localstack-stop:
    localstack stop

localstack-status:
    localstack status

localstack-logs:
    localstack logs

# S3
s3-create-bucket:
    aws --endpoint-url={{localstack-endpoint}} s3 mb s3://{{s3-bucket}}

s3-list-buckets:
    aws --endpoint-url={{localstack-endpoint}} s3 ls

s3-list-bucket-content:
    aws --endpoint-url={{localstack-endpoint}} s3 ls s3://{{s3-bucket}}

s3-upload-file:
    aws --endpoint-url={{localstack-endpoint}} s3 cp lic/index.html s3://{{s3-bucket}}

# SQS
sqs-list-queues:
    aws --endpoint-url={{localstack-endpoint}} sqs list-queues

sqs-create-queue:
    aws --endpoint-url={{localstack-endpoint}} sqs create-queue --queue-name {{sqs-queue}}

sqs-delete-queue:
    aws --endpoint-url={{localstack-endpoint}} sqs delete-queue --queue-url http://localhost:4566/{{aws-account}}/{{sqs-queue}}

sqs-send-message:
    aws --endpoint-url={{localstack-endpoint}} sqs send-message --queue-url http://localhost:4566/{{aws-account}}/{{sqs-queue}} --message-body "Hello World"

sqs-receive-message:
    aws --endpoint-url={{localstack-endpoint}} sqs receive-message --queue-url http://localhost:4566/{{aws-account}}/{{sqs-queue}}

# DynamoDB
dynamodb-list-tables:
    aws --endpoint-url={{localstack-endpoint}} dynamodb list-tables

dynamodb-create-table:
    aws --endpoint-url={{localstack-endpoint}} dynamodb create-table \
    --attribute-definitions '[{"AttributeName":"pk", "AttributeType":"S"}, {"AttributeName":"sk", "AttributeType":"S"}]' \
    --table-name {{dynamodb-table}} \
    --key-schema '[{"AttributeName":"pk", "KeyType":"HASH"}, {"AttributeName":"sk", "KeyType":"RANGE"}]' \
    --provisioned-throughput '{"ReadCapacityUnits": 10, "WriteCapacityUnits": 10}'

dynamodb-describe-table:
    aws --endpoint-url={{localstack-endpoint}} dynamodb describe-table --table-name {{dynamodb-table}}

# Lambda
lambda-list-functions:
    aws --endpoint-url={{localstack-endpoint}} lambda list-functions

lambda-create-function:
    cd lambda && zip my_lambda.zip my_lambda.py
    aws --endpoint-url={{localstack-endpoint}} lambda create-function \
    --function-name {{lambda-name}} \
    --runtime python3.9 \
    --zip-file fileb://lambda/my_lambda.zip \
    --handler my_lambda.handler \
    --role arn:aws:iam::{{aws-account}}:role/lambda-role

# CloudWatch Logs
logs-create-group:
    aws --endpoint-url={{localstack-endpoint}} logs create-log-group --log-group-name "{{log-group}}"
    aws --endpoint-url={{localstack-endpoint}} logs create-log-stream --log-group-name "{{log-group}}" --log-stream-name "{{log-stream}}"

logs-put-events:
    aws --endpoint-url={{localstack-endpoint}} logs put-log-events \
    --log-group-name {{log-group}} \
    --log-stream-name {{log-stream}} \
    --log-events '[{"timestamp": '$(($(date +%s) * 1000))', "message": "Log from '$(whoami)'@'$(hostname)' - ID: '$(uuidgen)'"}]'

# Step Functions
stepfunctions-list:
    aws --endpoint-url={{localstack-endpoint}} stepfunctions list-state-machines

stepfunctions-create:
    aws --endpoint-url={{localstack-endpoint}} stepfunctions create-state-machine \
    --name {{stepfn-name}} \
    --definition file://step/my_step_function.json \
    --role-arn arn:aws:iam::{{aws-account}}:role/DummyRole

stepfunctions-start-execution:
    aws --endpoint-url={{localstack-endpoint}} stepfunctions start-execution \
    --state-machine-arn arn:aws:states:{{aws-region}}:{{aws-account}}:stateMachine:{{stepfn-name}}

stepfunctions-list-executions:
    aws --endpoint-url={{localstack-endpoint}} stepfunctions list-executions \
    --state-machine-arn arn:aws:states:{{aws-region}}:{{aws-account}}:stateMachine:{{stepfn-name}}

logs-list-groups:
    aws --endpoint-url={{localstack-endpoint}} logs describe-log-groups

create:
    just s3-create-bucket
    just sqs-create-queue
    just dynamodb-create-table
    just lambda-create-function
    just logs-create-group
    just stepfunctions-create