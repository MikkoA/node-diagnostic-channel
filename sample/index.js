"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
// This is for testing the overall integration
var ApplicationInsights = require("applicationinsights");
// For demo purposes: hook up AI context preserving
// This is something that applicationinsights would do
var diagnostic_channel_1 = require("diagnostic-channel");
diagnostic_channel_1.channel.addContextPreservation(function (cb) {
    return ApplicationInsights.wrapWithCorrelationContext(cb);
});
var diagnostic_channel_publishers_1 = require("diagnostic-channel-publishers");
diagnostic_channel_publishers_1.enable();
require("bunyan-sub");
require("console-sub");
require("mongodb-sub");
require("mysql-sub");
require("redis-sub");
// Verify that patches are applied
console.dir(diagnostic_channel_1.channel.getPatchesObject());
diagnostic_channel_1.channel.subscribe("console", function (event) {
    process.stdout.write("Console subscriber>\t" + event.data.message);
});
console.log("Test message");
//# sourceMappingURL=index.js.map