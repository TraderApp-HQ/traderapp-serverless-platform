import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import log from "@dazn/lambda-powertools-logger";

const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "eu-west-1",
});

export const getSecrets = async <T>(secretName: string): Promise<T> => {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    log.info("Secret name fetched", { secretName });
    return JSON.parse(response.SecretString || "{}") as T;
};
