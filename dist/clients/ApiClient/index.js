"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIClient = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = __importDefault(require("axios"));
class APIClient {
    constructor(baseURL) {
        this.axiosInstance = axios_1.default.create({ baseURL });
        this.url = baseURL;
    }
    async post({ url, options, data }) {
        return this.request({
            method: "post",
            url: url ?? this.url,
            data,
            ...options,
        });
    }
    async get({ url, options }) {
        return this.request({
            method: "get",
            url: url ?? this.url,
            ...options,
        });
    }
    async put({ url, options, data }) {
        return this.request({
            method: "put",
            url: url ?? this.url,
            data,
            ...options,
        });
    }
    async patch({ url, options, data }) {
        return this.request({
            method: "patch",
            url: url ?? this.url,
            data,
            ...options,
        });
    }
    async delete({ url, options }) {
        return this.request({
            method: "delete",
            url: url ?? this.url,
            ...options,
        });
    }
    async request(options) {
        try {
            const response = await this.axiosInstance.request(options);
            return response.data;
        }
        catch (error) {
            if (options.retry && error.response?.status >= 500) {
                await this.delay(5000); // 5 seconds delay
                return this.request({ ...options, retry: false });
            }
            throw error;
        }
    }
    async delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.APIClient = APIClient;
