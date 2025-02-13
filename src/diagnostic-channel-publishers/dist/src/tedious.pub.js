"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enable = exports.tedious = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var diagnostic_channel_1 = require("diagnostic-channel");
var tediousPatchFunction = function (originalTedious) {
    var originalMakeRequest = originalTedious.Connection.prototype.makeRequest;
    originalTedious.Connection.prototype.makeRequest = function makeRequest() {
        function getPatchedCallback(origCallback) {
            var start = process.hrtime();
            var data = {
                query: {},
                database: {
                    host: null,
                    port: null
                },
                result: null,
                error: null,
                duration: 0
            };
            return diagnostic_channel_1.channel.bindToContext(function (err, rowCount, rows) {
                var end = process.hrtime(start);
                data = __assign(__assign({}, data), { database: {
                        host: this.connection.config.server,
                        port: this.connection.config.options.port
                    }, result: !err && { rowCount: rowCount, rows: rows }, query: {
                        text: this.parametersByName.statement.value
                    }, error: err, duration: Math.ceil((end[0] * 1e3) + (end[1] / 1e6)) });
                diagnostic_channel_1.channel.publish("tedious", data);
                origCallback.call(this, err, rowCount, rows);
            });
        }
        var request = arguments[0];
        arguments[0].callback = getPatchedCallback(request.callback);
        originalMakeRequest.apply(this, arguments);
    };
    return originalTedious;
};
exports.tedious = {
    versionSpecifier: ">= 6.0.0 < 9.0.0",
    patch: tediousPatchFunction
};
function enable() {
    diagnostic_channel_1.channel.registerMonkeyPatch("tedious", exports.tedious);
}
exports.enable = enable;
//# sourceMappingURL=tedious.pub.js.map