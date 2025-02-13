"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enable = exports.postgresPool1 = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var diagnostic_channel_1 = require("diagnostic-channel");
function postgresPool1PatchFunction(originalPgPool) {
    var originalConnect = originalPgPool.prototype.connect;
    originalPgPool.prototype.connect = function connect(callback) {
        if (callback) {
            arguments[0] = diagnostic_channel_1.channel.bindToContext(callback);
        }
        return originalConnect.apply(this, arguments);
    };
    return originalPgPool;
}
exports.postgresPool1 = {
    versionSpecifier: ">= 1.0.0 < 3.0.0",
    patch: postgresPool1PatchFunction
};
function enable() {
    diagnostic_channel_1.channel.registerMonkeyPatch("pg-pool", exports.postgresPool1);
}
exports.enable = enable;
//# sourceMappingURL=pg-pool.pub.js.map