"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBClient = void 0;
class MongoDBClient {
    constructor(connection, collection) {
        this.connection = connection;
        this.collection = collection;
    }
    async findOne(filter, options) {
        return this.connection
            .collection(this.collection)
            .findOne(filter, options);
    }
    async find(filter, options) {
        const result = this.connection
            .collection(this.collection)
            .find(filter, options);
        return (await result.toArray());
    }
    async findAll() {
        await this.connection.asPromise(); // Wait for connection to be ready
        const collection = this.connection.collection(this.collection);
        if (!collection) {
            throw new Error(`${this.collection} collection is undefined`);
        }
        const result = (await collection.find({}).toArray());
        return result;
    }
    async insertOne(doc, options) {
        const result = await this.connection
            .collection(this.collection)
            .insertOne(doc, options);
        return { ...doc, _id: result.insertedId };
    }
    async updateOne(filter, update, options) {
        const result = await this.connection
            .collection(this.collection)
            .updateOne(filter, update, options);
        return {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            acknowledged: result.acknowledged,
        };
    }
    async findOneAndUpdate(filter, update) {
        const result = await this.connection
            .collection(this.collection)
            .findOneAndUpdate(filter, update, { returnDocument: "after" } // returns the updated document
        );
        return result;
    }
    async deleteOne(filter) {
        const result = await this.connection
            .collection(this.collection)
            .deleteOne(filter);
        return result.deletedCount > 0;
    }
    async deleteMany(filter) {
        const result = await this.connection
            .collection(this.collection)
            .deleteMany(filter);
        return result.deletedCount > 0;
    }
}
exports.MongoDBClient = MongoDBClient;
