import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import { DatabaseConnections } from "src/config/interfaces";
import { getSecrets } from "src/config/secrets/helpers";
import { SecretLocation } from "src/config/secrets/enums";
import { runScript } from "src/config/scripts/config";
import {
    ITradingEngineServiceSecrets,
    IUsersServiceSecrets,
} from "src/config/secrets/interfaces";
import ReferralsService from "src/services/ReferralsService";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
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

    const allFailedMessageIds: string[] = [];

    const bindEventToTrackingHandler = (event: SQSEvent) => {
        return async (connections: DatabaseConnections): Promise<void> => {
            const { failedMessageIds } =
                await ReferralsService.processUserReferralTracking(
                    connections,
                    event
                );
            allFailedMessageIds.push(...failedMessageIds);
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

    return {
        batchItemFailures: allFailedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
