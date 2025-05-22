"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/clients/MongoDBClient/index.ts
var MongoDBClient_exports = {};
__export(MongoDBClient_exports, {
  MongoDBClient: () => MongoDBClient
});
module.exports = __toCommonJS(MongoDBClient_exports);
var MongoDBClient = class {
  constructor(connection, collection) {
    this.connection = connection;
    this.collection = collection;
  }
  async findOne(filter) {
    return this.connection.collection(this.collection).findOne(filter);
  }
  async find(filter) {
    const result = this.connection.collection(this.collection).find(filter);
    return await result.toArray();
  }
  async findAll() {
    await this.connection.asPromise();
    const collection = this.connection.collection(this.collection);
    if (!collection) {
      throw new Error(`${this.collection} collection is undefined`);
    }
    const result = await collection.find({}).toArray();
    return result;
  }
  async insertOne(doc) {
    const result = await this.connection.collection(this.collection).insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }
  async updateOne(filter, update) {
    const result = await this.connection.collection(this.collection).updateOne(filter, update);
    return result.modifiedCount > 0;
  }
  async deleteOne(filter) {
    const result = await this.connection.collection(this.collection).deleteOne(filter);
    return result.deletedCount > 0;
  }
  async deleteMany(filter) {
    const result = await this.connection.collection(this.collection).deleteMany(filter);
    return result.deletedCount > 0;
  }
  // Add any other MongoDB operations you commonly use
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MongoDBClient
});
