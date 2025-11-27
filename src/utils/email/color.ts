import { TradeSide } from "src/services/TradingEngineService/enums";

export function getTradeSideColor(side: TradeSide): string {
    const TradeSideColor: Record<TradeSide, string> = {
        [TradeSide.LONG]: "color:#08875d; background-color:#edfdf8;",
        [TradeSide.SHORT]: "color:#e02d3c; background-color:#fef1f2;",
    };

    return TradeSideColor[side];
}
