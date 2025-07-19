"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScript = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const runScript = async ({ scriptFunction, dbUrls, }) => {
    const connections = {};
    for (const [dbName, url] of Object.entries(dbUrls)) {
        connections[dbName] = mongoose_1.default.createConnection(url);
    }
    const connectionArray = Object.values(connections);
    try {
        await Promise.all(connectionArray.map((conn) => conn.asPromise()));
        console.log("Connected to the necessary database(s)");
        await scriptFunction(connections);
        console.log("Operation finished successfully");
    }
    catch (err) {
        console.error(`An error occurred: ${err}`);
    }
    finally {
        try {
            await Promise.all(connectionArray.map((conn) => conn.close()));
            console.log("Disconnected from database(s)");
        }
        catch (err) {
            console.error(`An error occured while disconnecting: ${err}`);
        }
    }
};
exports.runScript = runScript;
