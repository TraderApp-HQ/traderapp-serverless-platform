"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecrets = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const client = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION || "eu-west-1",
});
const getSecrets = async (secretName) => {
    const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    lambda_powertools_logger_1.default.info("Secret name fetched", { secretName });
    return JSON.parse(response.SecretString || "{}");
};
exports.getSecrets = getSecrets;
