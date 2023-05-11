"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var ApplicationInsights = require("applicationinsights");
var diagnostic_channel_1 = require("diagnostic-channel");
var subscriber = function (event) {
    if (ApplicationInsights.defaultClient) {
        var severity = event.data.stderr
            ? ApplicationInsights.Contracts.SeverityLevel.Warning
            : ApplicationInsights.Contracts.SeverityLevel.Information;
        ApplicationInsights.defaultClient.trackTrace({ message: event.data.message, severity: severity });
    }
};
exports.subscriber = subscriber;
diagnostic_channel_1.channel.subscribe("console", exports.subscriber);
//# sourceMappingURL=console.sub.js.map