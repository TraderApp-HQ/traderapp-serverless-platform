/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from "mongoose";

export class MongoDBClient<T> {
    private collection: string;
    private connection: Connection;

    constructor(connection: Connection, collection: string) {
        this.connection = connection;
        this.collection = collection;
    }

    async findOne(filter: Record<string, any>): Promise<T | null> {
        return this.connection
            .collection(this.collection)
            .findOne(filter) as Promise<T | null>;
    }

    async find(filter: Record<string, any>): Promise<T[]> {
        return this.connection
            .collection(this.collection)
            .find(filter)
            .toArray() as Promise<T[]>;
    }

    async insertOne(doc: Partial<T>): Promise<T> {
        const result = await this.connection
            .collection(this.collection)
            .insertOne(doc);
        return { ...doc, _id: result.insertedId } as T;
    }

    async updateOne(
        filter: Record<string, any>,
        update: Record<string, any>
    ): Promise<boolean> {
        const result = await this.connection
            .collection(this.collection)
            .updateOne(filter, update);
        return result.modifiedCount > 0;
    }

    async deleteOne(filter: Record<string, any>): Promise<boolean> {
        const result = await this.connection
            .collection(this.collection)
            .deleteOne(filter);
        return result.deletedCount > 0;
    }

    // Add any other MongoDB operations you commonly use
}
