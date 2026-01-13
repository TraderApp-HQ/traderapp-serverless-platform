import json
from app.mt5_client import connect_and_fetch_account

def handle_connect(event):
    """
    POST body:
    {
      "login": 123456,
      "password": "password",
      "server": "Broker-Server"
    }
    """

    try:
        body = json.loads(event["body"])

        result = connect_and_fetch_account(
            login=body["login"],
            password=body["password"],
            server=body["server"]
        )

        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }

    except Exception as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)})
        }
