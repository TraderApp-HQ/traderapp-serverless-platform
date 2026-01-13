"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/cypher-helpers.ts
var cypher_helpers_exports = {};
__export(cypher_helpers_exports, {
  decrypt: () => decrypt,
  encrypt: () => encrypt
});
module.exports = __toCommonJS(cypher_helpers_exports);
var import_crypto = __toESM(require("crypto"));
var IV_LENGTH = 16;
var encrypt = (text, decryptionKey) => {
  const iv = import_crypto.default.randomBytes(IV_LENGTH);
  const cipher = import_crypto.default.createCipheriv(
    "aes-256-cbc",
    Buffer.from(decryptionKey),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};
var decrypt = (encrypted, decryptionKey) => {
  const textParts = encrypted.split(":");
  const iv = Buffer.from(textParts[0], "hex");
  const encryptedText = Buffer.from(textParts[1], "hex");
  const decipher = import_crypto.default.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(decryptionKey),
    iv
  );
  let decrypted = decipher.update(
    encryptedText,
    void 0,
    "utf8"
  );
  decrypted += decipher.final("utf8");
  return decrypted;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  decrypt,
  encrypt
});
