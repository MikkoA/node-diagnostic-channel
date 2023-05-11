"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var ApplicationInsights = require("applicationinsights");
var diagnostic_channel_1 = require("diagnostic-channel");
var subscriber = function (event) {
    if (ApplicationInsights.defaultClient) {
        if (event.data.commandObj.command === "redis") {
            // We don't want to report 'info', it's irrelevant
            return;
        }
        ApplicationInsights.defaultClient.trackDependency({
            target: event.data.address,
            name: event.data.commandObj.command,
            data: event.data.commandObj.command,
            duration: event.data.duration,
            success: !event.data.err,
            resultCode: event.data.err ? "1" : "0",
            dependencyTypeName: "redis"
        });
    }
};
exports.subscriber = subscriber;
diagnostic_channel_1.channel.subscribe("redis", exports.subscriber);
//# sourceMappingURL=redis.sub.js.map