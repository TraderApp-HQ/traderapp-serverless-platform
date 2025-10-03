/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from "mongoose";

export class MongoDBClient<T> {
    private collection: string;
    private connection: Connection;

    constructor(connection: Connection, collection: string) {
        this.connection = connection;
        this.collection = collection;
    }

    async findOne(
        filter: Record<string, any>,
        options?: Record<string, any>
    ): Promise<T | null> {
        return this.connection
            .collection(this.collection)
            .findOne(filter, options) as Promise<T | null>;
    }

    async find(
        filter: Record<string, any>,
        options?: Record<string, any>
    ): Promise<T[]> {
        const result = this.connection
            .collection(this.collection)
            .find(filter, options);
        return (await result.toArray()) as T[];
    }

    async findAll(): Promise<T[]> {
        await this.connection.asPromise(); // Wait for connection to be ready
        const collection = this.connection.collection(this.collection);
        if (!collection) {
            throw new Error(`${this.collection} collection is undefined`);
        }
        const result = (await collection.find({}).toArray()) as T[];
        return result;
    }

    async insertOne(
        doc: Partial<T>,
        options?: Record<string, any>
    ): Promise<T> {
        const result = await this.connection
            .collection(this.collection)
            .insertOne(doc, options);
        return { ...doc, _id: result.insertedId } as T;
    }

    async updateOne(
        filter: Record<string, any>,
        update: Record<string, any>,
        options?: Record<string, any>
    ): Promise<{
        modifiedCount: number;
        matchedCount: number;
        acknowledged: boolean;
    }> {
        const result = await this.connection
            .collection(this.collection)
            .updateOne(filter, update, options);
        return {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            acknowledged: result.acknowledged,
        };
    }

    async findOneAndUpdate(
        filter: Record<string, any>,
        update: Record<string, any>
    ): Promise<T | null> {
        const result = await this.connection
            .collection(this.collection)
            .findOneAndUpdate(
                filter,
                update,
                { returnDocument: "after" } // returns the updated document
            );
        return result?.value as T | null;
    }

    async deleteOne(filter: Record<string, any>): Promise<boolean> {
        const result = await this.connection
            .collection(this.collection)
            .deleteOne(filter);
        return result.deletedCount > 0;
    }

    async deleteMany(filter: Record<string, any>): Promise<boolean> {
        const result = await this.connection
            .collection(this.collection)
            .deleteMany(filter);
        return result.deletedCount > 0;
    }

    // Add any other MongoDB operations you commonly use
}
