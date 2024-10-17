"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecrets = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// import log from '@dazn/lambda-powertools-logger';
const client = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION || "eu-west-1",
});
const getSecrets = async (secretName) => {
    try {
        console.info("Secret name", { secretName });
        const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        console.log("fetched secrets successfully");
        return JSON.parse(response.SecretString || "{}");
    }
    catch (error) {
        throw new Error(`Error getting secrets: ${error.message}`);
    }
};
exports.getSecrets = getSecrets;
