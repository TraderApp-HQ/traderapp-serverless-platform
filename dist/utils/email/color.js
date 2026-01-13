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

// src/utils/email/color.ts
var color_exports = {};
__export(color_exports, {
  getTradeSideColor: () => getTradeSideColor
});
module.exports = __toCommonJS(color_exports);
function getTradeSideColor(side) {
  const TradeSideColor = {
    ["LONG" /* LONG */]: "color:#08875d; background-color:#edfdf8;",
    ["SHORT" /* SHORT */]: "color:#e02d3c; background-color:#fef1f2;"
  };
  return TradeSideColor[side];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTradeSideColor
});
