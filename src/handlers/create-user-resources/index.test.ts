import log from "@dazn/lambda-powertools-logger";
import { SQSEvent } from "aws-lambda";
import { handler as createUserResourcesHandler } from ".";
import { createUserResources } from "./helpers";

// Mock the helpers module
jest.mock("./helpers");
jest.mock("@dazn/lambda-powertools-logger");

// Test data
const mockSQSEvent = {
    Records: [
        {
            messageId: "create-user-resources-test-message-id-1",
            body: JSON.stringify({
                body: {
                    userId: "123abc456def789ghi",
                },
            }),
        },
        {
            messageId: "create-user-resources-test-message-id-2",
            body: JSON.stringify({
                body: {
                    userId: "456def789ghi123abc",
                },
            }),
        },
    ],
} as unknown as SQSEvent;

describe("create-user-resources Lambda Handler", () => {
    const mockCreateUserResources = createUserResources as jest.MockedFunction<
        typeof createUserResources
    >;
    const mockLogInfo = log.info as jest.MockedFunction<typeof log.info>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should process SQS event and call createUserResources helper", async () => {
        mockCreateUserResources.mockResolvedValueOnce({
            successMessageIds: [
                "create-user-resources-test-message-id-1",
                "create-user-resources-test-message-id-2",
            ],
            failedMessageIds: [],
        });

        const result = await createUserResourcesHandler(mockSQSEvent);

        expect(mockCreateUserResources).toHaveBeenCalledTimes(1);
        expect(mockCreateUserResources).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    messageId: "create-user-resources-test-message-id-1",
                    body: expect.objectContaining({
                        body: expect.objectContaining({
                            userId: "123abc456def789ghi",
                        }),
                    }),
                }),
                expect.objectContaining({
                    messageId: "create-user-resources-test-message-id-2",
                    body: expect.objectContaining({
                        body: expect.objectContaining({
                            userId: "456def789ghi123abc",
                        }),
                    }),
                }),
            ])
        );
        expect(result).toEqual({
            batchItemFailures: [],
        });
        expect(mockLogInfo).toHaveBeenCalledWith(
            "Handler for user resources creation"
        );
    });

    it("should return failed message IDs in batchItemFailures when resources creation fails", async () => {
        mockCreateUserResources.mockResolvedValueOnce({
            successMessageIds: ["create-user-resources-test-message-id-1"],
            failedMessageIds: ["create-user-resources-test-message-id-2"],
        });

        const result = await createUserResourcesHandler(mockSQSEvent);

        expect(mockCreateUserResources).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            batchItemFailures: [
                {
                    itemIdentifier: "create-user-resources-test-message-id-2",
                },
            ],
        });
    });

    it("should handle all messages failing", async () => {
        mockCreateUserResources.mockResolvedValueOnce({
            successMessageIds: [],
            failedMessageIds: [
                "create-user-resources-test-message-id-1",
                "create-user-resources-test-message-id-2",
            ],
        });

        const result = await createUserResourcesHandler(mockSQSEvent);

        expect(result).toEqual({
            batchItemFailures: [
                {
                    itemIdentifier: "create-user-resources-test-message-id-1",
                },
                {
                    itemIdentifier: "create-user-resources-test-message-id-2",
                },
            ],
        });
    });

    it("should handle empty SQS event", async () => {
        const emptyEvent = {
            Records: [],
        } as unknown as SQSEvent;

        mockCreateUserResources.mockResolvedValueOnce({
            successMessageIds: [],
            failedMessageIds: [],
        });

        const result = await createUserResourcesHandler(emptyEvent);

        expect(mockCreateUserResources).toHaveBeenCalledWith([]);
        expect(result).toEqual({
            batchItemFailures: [],
        });
    });

    it("should handle errors from createUserResources", async () => {
        mockCreateUserResources.mockRejectedValueOnce(
            new Error("Database connection failed")
        );

        await expect(createUserResourcesHandler(mockSQSEvent)).rejects.toThrow(
            "Database connection failed"
        );
        expect(mockCreateUserResources).toHaveBeenCalledTimes(1);
    });
});
