"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var ApplicationInsights = require("applicationinsights");
var diagnostic_channel_1 = require("diagnostic-channel");
var subscriber = function (event) {
    if (ApplicationInsights.defaultClient) {
        var queryObj = event.data.query || {};
        var sqlString = queryObj.sql || "Unknown query";
        var success = !event.data.err;
        var connection = queryObj._connection || {};
        var connectionConfig = connection.config || {};
        var dbName = connectionConfig.socketPath ? connectionConfig.socketPath : (connectionConfig.host || "localhost") + ":" + connectionConfig.port;
        ApplicationInsights.defaultClient.trackDependency({
            target: dbName,
            name: sqlString,
            data: sqlString,
            duration: event.data.duration,
            success: success,
            // TODO: transmit result code from mysql
            resultCode: success ? "0" : "1",
            dependencyTypeName: "mysql"
        });
    }
};
exports.subscriber = subscriber;
diagnostic_channel_1.channel.subscribe("mysql", exports.subscriber);
//# sourceMappingURL=mysql.sub.js.map