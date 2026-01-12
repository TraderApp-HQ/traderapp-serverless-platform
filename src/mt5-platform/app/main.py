import json
from app.handlers.connect import handle_connect

def lambda_handler(event, context):
    return handle_connect(event)
