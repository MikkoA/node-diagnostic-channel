"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriber = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var ApplicationInsights = require("applicationinsights");
var diagnostic_channel_1 = require("diagnostic-channel");
// Mapping from bunyan levels defined at https://github.com/trentm/node-bunyan/blob/master/lib/bunyan.js#L256
var bunyanToAILevelMap = {};
bunyanToAILevelMap[10] = ApplicationInsights.Contracts.SeverityLevel.Verbose;
bunyanToAILevelMap[20] = ApplicationInsights.Contracts.SeverityLevel.Verbose;
bunyanToAILevelMap[30] = ApplicationInsights.Contracts.SeverityLevel.Information;
bunyanToAILevelMap[40] = ApplicationInsights.Contracts.SeverityLevel.Warning;
bunyanToAILevelMap[50] = ApplicationInsights.Contracts.SeverityLevel.Error;
bunyanToAILevelMap[60] = ApplicationInsights.Contracts.SeverityLevel.Critical;
var subscriber = function (event) {
    if (ApplicationInsights.defaultClient) {
        var AIlevel = bunyanToAILevelMap[event.data.level];
        ApplicationInsights.defaultClient.trackTrace({ message: event.data.result, severity: AIlevel });
    }
};
exports.subscriber = subscriber;
diagnostic_channel_1.channel.subscribe("bunyan", exports.subscriber);
//# sourceMappingURL=bunyan.sub.js.map