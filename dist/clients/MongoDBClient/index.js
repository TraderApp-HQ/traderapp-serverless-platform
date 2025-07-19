"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBClient = void 0;
class MongoDBClient {
    constructor(connection, collection) {
        this.connection = connection;
        this.collection = collection;
    }
    async findOne(filter) {
        return this.connection
            .collection(this.collection)
            .findOne(filter);
    }
    async find(filter) {
        const result = this.connection.collection(this.collection).find(filter);
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
    async insertOne(doc) {
        const result = await this.connection
            .collection(this.collection)
            .insertOne(doc);
        return { ...doc, _id: result.insertedId };
    }
    async updateOne(filter, update) {
        const result = await this.connection
            .collection(this.collection)
            .updateOne(filter, update);
        return result.modifiedCount > 0;
    }
    async findOneAndUpdate(filter, update) {
        const result = await this.connection
            .collection(this.collection)
            .findOneAndUpdate(filter, update, { returnDocument: "after" } // returns the updated document
        );
        return result?.value;
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
