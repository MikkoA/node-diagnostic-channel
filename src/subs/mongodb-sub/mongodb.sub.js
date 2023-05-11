"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var ApplicationInsights = require("applicationinsights");
var diagnostic_channel_1 = require("diagnostic-channel");
var subscriber = function (event) {
    if (ApplicationInsights.defaultClient) {
        var dbName = (event.data.startedData && event.data.startedData.databaseName) || "Unknown database";
        ApplicationInsights.defaultClient
            .trackDependency({
            target: dbName,
            name: event.data.event.commandName,
            data: event.data.event.commandName,
            duration: event.data.event.duration,
            success: event.data.succeeded,
            // TODO: transmit result code from mongo
            resultCode: event.data.succeeded ? "0" : "1",
            dependencyTypeName: "mongodb"
        });
        if (!event.data.succeeded) {
            ApplicationInsights.defaultClient
                .trackException({ exception: new Error(event.data.event.failure) });
        }
    }
};
exports.subscriber = subscriber;
diagnostic_channel_1.channel.subscribe("mongodb", exports.subscriber);
//# sourceMappingURL=mongodb.sub.js.map