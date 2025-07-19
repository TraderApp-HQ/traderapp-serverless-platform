"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const helpers_1 = require("src/config/secrets/helpers");
const enums_1 = require("src/config/secrets/enums");
const config_1 = require("src/config/scripts/config");
const ReferralsService_1 = __importDefault(require("src/services/ReferralsService"));
const handler = async (event) => {
    lambda_powertools_logger_1.default.info("Processing referrals data", { event });
    const [tradingEngineServiceSecrets, usersServiceSecrets] = await Promise.all([
        (0, helpers_1.getSecrets)(`${enums_1.SecretLocation.tradingEngineServiceSecrets}/${process.env.ENV}`),
        (0, helpers_1.getSecrets)(`${enums_1.SecretLocation.usersServiceSecrets}/${process.env.ENV}`),
    ]);
    const allFailedMessageIds = [];
    const bindEventToTrackingHandler = (event) => {
        return async (connections) => {
            const { failedMessageIds } = await ReferralsService_1.default.processUserReferralTracking(connections, event);
            allFailedMessageIds.push(...failedMessageIds);
        };
    };
    await (0, config_1.runScript)({
        dbUrls: {
            tradingEngine: tradingEngineServiceSecrets.TRADING_ENGINE_SERVICE_DB_URL,
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
exports.handler = handler;
