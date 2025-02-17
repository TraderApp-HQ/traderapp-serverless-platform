import mongoose from "mongoose";
import { DatabaseConnections, DatabaseType, ScriptConfig } from "../interfaces";

export const runScript = async ({
    scriptFunction,
    dbUrls,
}: ScriptConfig): Promise<void> => {
    const connections: DatabaseConnections = {} as DatabaseConnections;

    for (const [dbName, url] of Object.entries(dbUrls)) {
        connections[dbName as DatabaseType] = mongoose.createConnection(url);
    }

    const connectionArray = Object.values(connections);
    try {
        await Promise.all(connectionArray.map((conn) => conn.asPromise()));
        console.log("Connected to the necessary database(s)");
        await scriptFunction(connections);
        console.log("Operation finished successfully");
    } catch (err) {
        console.error(`An error occurred: ${err}`);
    } finally {
        try {
            await Promise.all(connectionArray.map((conn) => conn.close()));
            console.log("Disconnected from database(s)");
        } catch (err) {
            console.error(`An error occured while disconnecting: ${err}`);
        }
    }
};
