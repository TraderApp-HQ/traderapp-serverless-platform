import { SQSEvent } from "aws-lambda";
// import NotificationsService from "../../services/NotificationsService";
import NotificationsService from "src/services/NotificationsService";

export const handler = async (event: SQSEvent) => {
    console.info(JSON.stringify(event));
    // NotificationsService.testFunction('')
};
