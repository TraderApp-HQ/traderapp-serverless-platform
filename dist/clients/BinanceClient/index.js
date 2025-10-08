"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceClient = void 0;
/* eslint-disable @typescript-eslint/consistent-type-definitions */
const binance_api_node_1 = __importStar(require("binance-api-node"));
class BinanceClient {
    constructor(apiKey, apiSecret) {
        this.client = (0, binance_api_node_1.default)({
            apiKey,
            apiSecret,
            httpFutures: process.env.NODE_ENV !== "production"
                ? "https://testnet.binancefuture.com"
                : undefined,
        });
    }
    /**
     * Place a new futures trade
     */
    async placeTrade(params) {
        try {
            // Set leverage and marginType
            await Promise.all([
                this.setMarginType({
                    symbol: params.symbol,
                    marginType: params.marginType ?? "ISOLATED",
                }).catch((error) => {
                    // Ignore error if margin type is already set to the desired value
                    if (error.message.includes("No need to change margin type")) {
                        return;
                    }
                    throw error;
                }),
                this.setLeverage({
                    symbol: params.symbol,
                    leverage: params.leverage ?? 1,
                }),
            ]);
            // Check for existing position
            // const existingPosition = await this.getOpenPosition({ symbol: params.symbol });
            // const positionAmount = existingPosition
            // 	? parseFloat(existingPosition.positionAmt as string)
            // 	: 0;
            // Determine if we're adding to or reducing the position
            // const isAddingToPosition =
            // 	existingPosition !== null &&
            // 	((positionAmount > 0 && params.side === "BUY") ||
            // 		(positionAmount < 0 && params.side === "SELL"));
            const baseOrder = {
                symbol: params.symbol,
                side: params.side,
                quantity: params.quantity.toString(),
                positionSide: params.positionSide || "BOTH",
                // reduceOnly: (isAddingToPosition ? "false" : "false") as "true" | "false",
            };
            let orderParams;
            switch (params.type) {
                case "MARKET":
                    orderParams = {
                        ...baseOrder,
                        type: "MARKET",
                    };
                    break;
                case "LIMIT":
                    if (!params.price)
                        throw new Error("Price is required for LIMIT orders");
                    orderParams = {
                        ...baseOrder,
                        type: "LIMIT",
                        price: params.price.toString(),
                        timeInForce: "GTC", // Good Till Cancelled
                    };
                    break;
                // case "STOP":
                // 	if (!params.price || !params.stopPrice)
                // 		throw new Error("Price and stopPrice are required for STOP orders");
                // 	orderParams = {
                // 		...baseOrder,
                // 		type: "STOP",
                // 		price: params.price.toString(),
                // 		stopPrice: params.stopPrice.toString(),
                // 	};
                // 	break;
                // case "STOP_MARKET":
                // 	if (!params.stopPrice)
                // 		throw new Error("stopPrice is required for STOP_MARKET orders");
                // 	orderParams = {
                // 		...baseOrder,
                // 		type: "STOP_MARKET",
                // 		stopPrice: params.stopPrice.toString(),
                // 	};
                // 	break;
                // case "TAKE_PROFIT":
                // 	if (!params.price || !params.stopPrice)
                // 		throw new Error("Price and stopPrice are required for TAKE_PROFIT orders");
                // 	orderParams = {
                // 		...baseOrder,
                // 		type: "TAKE_PROFIT",
                // 		price: params.price.toString(),
                // 		stopPrice: params.stopPrice.toString(),
                // 	};
                // 	break;
                // case "TAKE_PROFIT_MARKET":
                // 	if (!params.stopPrice)
                // 		throw new Error("stopPrice is required for TAKE_PROFIT_MARKET orders");
                // 	orderParams = {
                // 		...baseOrder,
                // 		type: "TAKE_PROFIT_MARKET",
                // 		stopPrice: params.stopPrice.toString(),
                // 	};
                // 	break;
                default:
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    throw new Error(`Unsupported order type: ${params.type}`);
            }
            // Place main order
            const mainOrder = await this.client.futuresOrder(orderParams);
            console.log("######### mainOrder placed ############", {
                mainOrder,
            });
            return mainOrder;
        }
        catch (error) {
            throw new Error(`Failed to place trade: ${error}`);
        }
    }
    /**
     * Place target profit orders after checking if main order is filled
     */
    async placeTargetProfitOrders(params) {
        try {
            // Check if main order is filled
            const mainOrder = await this.getTradeById({
                origClientOrderId: params.origClientOrderId,
                symbol: params.symbol,
            });
            if (mainOrder.status !== "FILLED") {
                throw new Error(`Main order is not filled yet. Status: ${mainOrder.status}`);
            }
            const executedQty = parseFloat(mainOrder.executedQty);
            console.log("######### Executed Qty for targets ############", {
                executedQty,
            });
            if (executedQty <= 0) {
                throw new Error("No quantity was executed for the main order");
            }
            // Sort target profits by price based on side
            const sortedTargets = params.mainOrderSide === binance_api_node_1.OrderSide.BUY
                ? [...params.targetProfits].sort((a, b) => a.price - b.price) // ascending for BUY
                : [...params.targetProfits].sort((a, b) => b.price - a.price); // descending for SELL
            // Calculate quantities for each target
            let qtyLeft = executedQty;
            const tpOrderPromises = [];
            for (let i = 0; i < sortedTargets.length; i++) {
                const tp = sortedTargets[i];
                let tpQty;
                if (i < sortedTargets.length - 1) {
                    // For all but the last target, round down to 8 decimals
                    tpQty =
                        Math.floor(((executedQty * tp.percent) / 100) * 1e8) /
                            1e8;
                    qtyLeft -= tpQty;
                }
                else {
                    // Last target gets the remainder
                    tpQty = Math.max(qtyLeft, 0);
                }
                if (tpQty <= 0)
                    continue; // skip if nothing left
                console.log(`############## Target Profit Qty ${i + 1} ========== ${tpQty}`);
                const tpSide = params.mainOrderSide === binance_api_node_1.OrderSide.BUY ? "SELL" : "BUY";
                tpOrderPromises.push(this.client.futuresOrder({
                    symbol: params.symbol,
                    side: tpSide,
                    quantity: tpQty.toFixed(8),
                    type: "TAKE_PROFIT_MARKET",
                    stopPrice: tp.price.toString(),
                    positionSide: params.positionSide || "BOTH",
                    reduceOnly: "true",
                }));
            }
            return await Promise.all(tpOrderPromises);
        }
        catch (error) {
            throw new Error(`Failed to place target profit orders: ${error}`);
        }
    }
    /**
     * Place stop loss order after checking if main order is filled
     */
    async placeStopLossOrder(params) {
        try {
            // Check if main order is filled
            const mainOrder = await this.getTradeById({
                origClientOrderId: params.origClientOrderId,
                symbol: params.symbol,
            });
            if (mainOrder.status !== "FILLED") {
                throw new Error(`Main order is not filled yet. Status: ${mainOrder.status}`);
            }
            const executedQty = parseFloat(mainOrder.executedQty);
            console.log("######### Executed Qty for stop loss ############", {
                executedQty,
            });
            if (executedQty <= 0) {
                throw new Error("No quantity was executed for the main order");
            }
            const slSide = params.mainOrderSide === binance_api_node_1.OrderSide.BUY ? "SELL" : "BUY";
            return await this.client.futuresOrder({
                symbol: params.symbol,
                side: slSide,
                quantity: executedQty.toFixed(8),
                type: "STOP_MARKET",
                stopPrice: params.stopLoss.price.toString(),
                positionSide: params.positionSide || "BOTH",
                reduceOnly: "true",
            });
        }
        catch (error) {
            throw new Error(`Failed to place stop loss order: ${error}`);
        }
    }
    /**
     * Get a specific trade by order ID for the current symbol
     */
    async getTradeById({ symbol, origClientOrderId, }) {
        try {
            const order = await this.client.futuresGetOrder({
                symbol,
                origClientOrderId,
            });
            return order;
        }
        catch (error) {
            throw new Error(`Failed to get trade: ${error}`);
        }
    }
    /**
     * Get the open position for the current symbol
     */
    async getOpenPosition({ symbol, }) {
        try {
            const positions = await this.client.futuresPositionRisk({ symbol });
            const position = positions.find((pos) => parseFloat(pos.positionAmt) !== 0);
            return position || null;
        }
        catch (error) {
            throw new Error(`Failed to get open position: ${error}`);
        }
    }
    /**
     * Close the open position for the current symbol
     */
    async closeAllPositions({ symbol, }) {
        try {
            const position = await this.getOpenPosition({ symbol });
            if (!position)
                return [];
            const side = (parseFloat(position.positionAmt) > 0 ? "SELL" : "BUY");
            const order = await this.client.futuresOrder({
                symbol,
                side,
                quantity: Math.abs(parseFloat(position.positionAmt)).toString(),
                type: "MARKET",
                positionSide: position.positionSide,
            });
            return [order];
        }
        catch (error) {
            throw new Error(`Failed to close all positions: ${error}`);
        }
    }
    /**
     * Set leverage for the symbol
     */
    async setLeverage({ symbol, leverage, }) {
        try {
            await this.client.futuresLeverage({
                symbol,
                leverage,
            });
        }
        catch (error) {
            throw new Error(`Failed to set leverage: ${error}`);
        }
    }
    /**
     * Set margin type (ISOLATED or CROSSED)
     */
    async setMarginType({ symbol, marginType, }) {
        try {
            await this.client.futuresMarginType({
                symbol,
                marginType,
            });
        }
        catch (error) {
            throw new Error(`Failed to set margin type: ${error}`);
        }
    }
    /**
     * Get all historical trades for a specific symbol
     */
    async getHistoricalTrades(symbol) {
        try {
            const orders = await this.client.futuresAllOrders({
                symbol,
            });
            return orders;
        }
        catch (error) {
            throw new Error(`Failed to get historical trades: ${error}`);
        }
    }
    /**
     * Get all open positions across all symbols
     */
    async getAllOpenPositions() {
        try {
            const positions = await this.client.futuresPositionRisk();
            return positions.filter((pos) => parseFloat(pos.positionAmt) !== 0);
        }
        catch (error) {
            throw new Error(`Failed to get all open positions: ${error}`);
        }
    }
}
exports.BinanceClient = BinanceClient;
