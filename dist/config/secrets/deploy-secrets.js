"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
// Load the YAML file
const loadYamlConfig = (filePath) => {
    try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        return yaml.load(fileContents);
    }
    catch (e) {
        console.error("Failed to load the YAML file:", e);
        throw e;
    }
};
const secretsManager = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
});
const sqsClient = new client_sqs_1.SQSClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
});
const errorMessages = [];
// Function to retrieve existing secrets and update or create new ones
const updateSecrets = async (secretFolder, secrets) => {
    try {
        // Retrieve the existing secrets
        const getCommand = new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: secretFolder,
        });
        const existingSecretsData = await secretsManager.send(getCommand);
        const existingSecrets = existingSecretsData.SecretString
            ? JSON.parse(existingSecretsData.SecretString)
            : {};
        // Merge new secrets with existing ones
        const updatedSecrets = { ...existingSecrets, ...secrets };
        // Store the updated secrets
        const putCommand = new client_secrets_manager_1.PutSecretValueCommand({
            SecretId: secretFolder,
            SecretString: JSON.stringify(updatedSecrets),
        });
        await secretsManager.send(putCommand);
        console.log(`Successfully updated secrets in ${secretFolder}`);
    }
    catch (error) {
        errorMessages.push(`Failed to update secrets in ${secretFolder}: ${error}`);
        console.error(error);
        throw error;
    }
};
// Function to process queue URLs and update secrets for each folder
const deployQueueUrls = async (env, configFilePath) => {
    const config = loadYamlConfig(configFilePath);
    for (const secretFolder in config) {
        const secrets = config[secretFolder];
        const secretUpdates = {};
        // Iterate through secrets for the current folder
        for (const secretName in secrets) {
            const { queueName } = secrets[secretName];
            const prefixedQueueName = `${env}-${queueName}`;
            console.log(`Fetching URL for Queue: ${prefixedQueueName}`);
            try {
                const getQueueUrlCommand = new client_sqs_1.GetQueueUrlCommand({
                    QueueName: prefixedQueueName,
                });
                const data = await sqsClient.send(getQueueUrlCommand);
                secretUpdates[secretName] = data.QueueUrl;
                console.log(`Fetched Queue URL for ${prefixedQueueName}: ${data.QueueUrl}`);
            }
            catch (error) {
                errorMessages.push(`Failed to retrieve URL for ${prefixedQueueName}: ${error}`);
                console.error(`Error fetching URL for ${prefixedQueueName}:`, error);
            }
        }
        // If there are any secret updates for the current folder, deploy them
        if (Object.keys(secretUpdates).length > 0) {
            try {
                await updateSecrets(`${secretFolder}/${env}`, secretUpdates);
            }
            catch (error) {
                console.error(`Failed to update secrets in folder ${secretFolder}/${env}. Error: ${error}`);
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
    console.error("Error: No environment specified. Please provide an environment.");
    process.exit(1);
}
const configFilePath = "./src/config/secrets/secrets-mappings.yaml";
(async () => {
    try {
        await deployQueueUrls(env, configFilePath);
        console.log("Deployment completed successfully.");
    }
    catch (err) {
        console.error("Deployment encountered errors:", err);
        errorMessages.forEach((errMsg) => console.error(errMsg));
        process.exit(1);
    }
})();
