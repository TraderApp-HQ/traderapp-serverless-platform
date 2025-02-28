import { SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import {
    DatabaseConnections,
    ITradingEngineServiceSecrets,
    IUsersServiceSecrets,
} from "src/config/interfaces";
import { getSecrets } from "src/config/secrets/helpers";
import { SecretLocation } from "src/config/secrets/enums";
import { runScript } from "src/config/scripts/config";
import { processUserReferralTracking } from "./helpers";

export const handler = async (event: SQSEvent): Promise<void> => {
    log.info("Processing referrals data", { event });

    const [tradingEngineServiceSecrets, usersServiceSecrets] =
        await Promise.all([
            getSecrets<ITradingEngineServiceSecrets>(
                `${SecretLocation.tradingEngineServiceSecrets}/${process.env.ENV}`
            ),
            getSecrets<IUsersServiceSecrets>(
                `${SecretLocation.usersServiceSecrets}/${process.env.ENV}`
            ),
        ]);

    const bindEventToTrackingHandler = (event: SQSEvent) => {
        return async (connections: DatabaseConnections): Promise<void> => {
            await processUserReferralTracking(connections, event);
        };
    };

    await runScript({
        dbUrls: {
            tradingEngine:
                tradingEngineServiceSecrets.TRADING_ENGINE_SERVICE_DB_URL,
            users: usersServiceSecrets.USERS_SERVICE_DB_URL,
        },
        scriptFunction: bindEventToTrackingHandler(event),
    });
};
