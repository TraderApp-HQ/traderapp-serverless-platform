import { SQSRecord } from "aws-lambda";
import mongoose from "mongoose";
import { EventTemplate } from "src/config/enums";

export interface IMessageRecipient {
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    emailAddress?: string;
    countryPhoneCode?: string;
}

export interface IQueueMessageBodyObject {
    recipients: IMessageRecipient[];
    subject?: string;
    message: string;
    event: EventTemplate;
    sender?: IMessageRecipient;
}

export interface IQueueMessageBody extends Omit<SQSRecord, "body"> {
    body: IQueueMessageBodyObject;
}

export enum DatabaseType {
    TRADING_ENGINE = "tradingEngine",
    USERS = "users",
}

export type DatabaseConnections = {
    [key in DatabaseType]: mongoose.Connection;
};

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    referralRank: string;
}

export interface ReferralQueueMessage {
    user: User;
    referrals: User[];
}

export interface IUsersServiceSecrets {
    USERS_SERVICE_DB_URL: string;
}

export interface ITradingEngineServiceSecrets {
    TRADING_ENGINE_SERVICE_DB_URL: string;
}

export interface ScriptConfig {
    scriptFunction: (connections: DatabaseConnections) => Promise<void>;
    dbUrls: { [dbName in DatabaseType]: string };
}

export interface UserDbConnection {
    userId: string;
    mongooseConnection: mongoose.Connection;
}

export interface UserBalance {
    availableBalance: number;
    lockedBalance?: number;
}

export interface ComputeBalanceInput {
    tradingEngineConnection: mongoose.Connection;
    referrals: ReferralQueueMessage["referrals"];
    userId: string;
}

export interface Balances {
    userBalance: UserBalance;
    communityBalance: number;
}

export interface UpdateUserRecordInput extends UserDbConnection {
    balance: Balances;
}
