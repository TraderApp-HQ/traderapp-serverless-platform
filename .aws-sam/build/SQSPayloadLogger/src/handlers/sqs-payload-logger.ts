import { SQSEvent, Context } from 'aws-lambda';

export const sqsPayloadLoggerHandler = async (event: SQSEvent, context: Context) => {
    console.info(JSON.stringify(event));
}
