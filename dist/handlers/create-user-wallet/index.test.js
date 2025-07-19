"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const WalletsService_1 = __importDefault(require("src/services/WalletsService"));
const _1 = require(".");
// Test data
const mockSQSEvent = {
    Records: [
        {
            messageId: "create-user-wallet-test-message-id-1",
            body: JSON.stringify({
                body: {
                    userId: "123abc456def789ghi",
                },
            }),
        },
    ],
};
// Mock WalletsService and log
jest.mock("src/services/WalletsService");
jest.mock("@dazn/lambda-powertools-logger");
describe("create-user-wallet Lambda Handler", () => {
    const mockCreateUserWallet = jest.fn();
    const mockLogInfo = jest.fn();
    beforeAll(() => {
        // Mock the createUserWallet method of WalletsService
        WalletsService_1.default.createUserWallet = mockCreateUserWallet;
        // Mock log.info
        lambda_powertools_logger_1.default.info = mockLogInfo;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("should process SQS event and call WalletsService.createUserWallet", async () => {
        mockCreateUserWallet.mockResolvedValueOnce({
            successMessageIds: ["create-user-wallet-test-message-id-1"],
            failedMessageIds: [],
        });
        const result = await (0, _1.handler)(mockSQSEvent);
        expect(mockCreateUserWallet).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            batchItemFailures: [],
        });
    });
    it("should return failed message IDs in batchItemFailures", async () => {
        mockCreateUserWallet.mockResolvedValueOnce({
            successMessageIds: [],
            failedMessageIds: ["create-user-wallet-test-message-id-1"],
        });
        const result = await (0, _1.handler)(mockSQSEvent);
        expect(result).toEqual({
            batchItemFailures: [
                {
                    itemIdentifier: "create-user-wallet-test-message-id-1",
                },
            ],
        });
    });
});
