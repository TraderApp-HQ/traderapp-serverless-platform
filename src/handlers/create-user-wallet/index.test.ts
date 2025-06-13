import log from "@dazn/lambda-powertools-logger";
import { SQSEvent } from "aws-lambda";
import WalletsService from "src/services/WalletsService";
import { handler as createUserWalletHandler } from ".";

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
} as unknown as SQSEvent;

// Mock WalletsService and log
jest.mock("src/services/WalletsService");
jest.mock("@dazn/lambda-powertools-logger");

describe("create-user-wallet Lambda Handler", () => {
    const mockCreateUserWallet = jest.fn();
    const mockLogInfo = jest.fn();

    beforeAll(() => {
        // Mock the createUserWallet method of WalletsService
        (WalletsService.createUserWallet as jest.Mock) = mockCreateUserWallet;
        // Mock log.info
        (log.info as jest.Mock) = mockLogInfo;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should process SQS event and call WalletsService.createUserWallet", async () => {
        mockCreateUserWallet.mockResolvedValueOnce({
            successMessageIds: ["create-user-wallet-test-message-id-1"],
            failedMessageIds: [],
        });

        const result = await createUserWalletHandler(mockSQSEvent);

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

        const result = await createUserWalletHandler(mockSQSEvent);

        expect(result).toEqual({
            batchItemFailures: [
                {
                    itemIdentifier: "create-user-wallet-test-message-id-1",
                },
            ],
        });
    });
});
