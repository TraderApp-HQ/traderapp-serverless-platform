/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    SecretsManagerClient,
    GetSecretValueCommand,
    PutSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { SQSClient, GetQueueUrlCommand } from "@aws-sdk/client-sqs";
import * as fs from "fs";
import * as yaml from "js-yaml";

// Load the YAML file
const loadYamlConfig = (filePath: string): any => {
    try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        return yaml.load(fileContents);
    } catch (e) {
        console.error("Failed to load the YAML file:", e);
        throw e;
    }
};

const secretsManager = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
});
const sqsClient = new SQSClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
});

const errorMessages: string[] = [];

// Function to retrieve existing secrets and update or create new ones
const updateSecrets = async (
    secretFolder: string,
    secrets: { [key: string]: string }
) => {
    try {
        // Retrieve the existing secrets
        const getCommand = new GetSecretValueCommand({
            SecretId: secretFolder,
        });
        const existingSecretsData = await secretsManager.send(getCommand);
        const existingSecrets = existingSecretsData.SecretString
            ? JSON.parse(existingSecretsData.SecretString)
            : {};

        // Merge new secrets with existing ones
        const updatedSecrets = { ...existingSecrets, ...secrets };

        // Store the updated secrets
        const putCommand = new PutSecretValueCommand({
            SecretId: secretFolder,
            SecretString: JSON.stringify(updatedSecrets),
        });
        await secretsManager.send(putCommand);
        console.log(`Successfully updated secrets in ${secretFolder}`);
    } catch (error) {
        errorMessages.push(
            `Failed to update secrets in ${secretFolder}: ${error}`
        );
        console.error(error);
        throw error;
    }
};

// Function to process queue URLs and update secrets for each folder
const deployQueueUrls = async (env: string, configFilePath: string) => {
    const config = loadYamlConfig(configFilePath);

    for (const secretFolder in config) {
        const secrets = config[secretFolder];
        const secretUpdates: { [key: string]: string } = {};

        // Iterate through secrets for the current folder
        for (const secretName in secrets) {
            const { queueName } = secrets[secretName];
            const prefixedQueueName = `${env}-${queueName}`;
            console.log(`Fetching URL for Queue: ${prefixedQueueName}`);

            try {
                const getQueueUrlCommand = new GetQueueUrlCommand({
                    QueueName: prefixedQueueName,
                });
                const data = await sqsClient.send(getQueueUrlCommand);
                secretUpdates[secretName] = data.QueueUrl as string;
                console.log(
                    `Fetched Queue URL for ${prefixedQueueName}: ${data.QueueUrl}`
                );
            } catch (error) {
                errorMessages.push(
                    `Failed to retrieve URL for ${prefixedQueueName}: ${error}`
                );
                console.error(
                    `Error fetching URL for ${prefixedQueueName}:`,
                    error
                );
            }
        }

        // If there are any secret updates for the current folder, deploy them
        if (Object.keys(secretUpdates).length > 0) {
            try {
                await updateSecrets(`${secretFolder}/${env}`, secretUpdates);
            } catch (error) {
                console.error(
                    `Failed to update secrets in folder ${secretFolder}/${env}. Error: ${error}`
                );
            }
        }
    }

    // Check if there were any errors during the process
    if (errorMessages.length > 0) {
        throw new Error("Some operations failed! Check logs for details.");
    }
};

// Extract the environment from command-line arguments
const args = process.argv.slice(2);
const env = args[0]; // Gets the first argument passed from the command line

if (!env) {
    console.error(
        "Error: No environment specified. Please provide an environment."
    );
    process.exit(1);
}

const configFilePath = "./src/config/secrets/secrets-mappings.yaml";

(async () => {
    try {
        await deployQueueUrls(env, configFilePath);
        console.log("Deployment completed successfully.");
    } catch (err) {
        console.error("Deployment encountered errors:", err);
        errorMessages.forEach((errMsg) => console.error(errMsg));
        process.exit(1);
    }
})();
