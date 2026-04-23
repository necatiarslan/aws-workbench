import json


def handler(event, context):
	print(json.dumps(event, default=str))
	return {
		"statusCode": 200,
		"body": "ok",
	}
