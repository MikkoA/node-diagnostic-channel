"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var api_1 = require("@opentelemetry/api");
var assert = require("assert");
var diagnostic_channel_1 = require("diagnostic-channel");
var azure_coretracing_pub_1 = require("../src/azure-coretracing.pub");
var assertSpans = function (events, span) {
    assert.equal(events.length, 0);
    span.end();
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].data, span);
};
describe("@azure/core-tracing@1.0.0-preview9+", function () {
    var events;
    var tracer;
    before(function () {
        azure_coretracing_pub_1.enable();
        diagnostic_channel_1.channel.subscribe("azure-coretracing", function (span) {
            events.push(span);
        });
        var coretracing = require("@azure/core-tracing");
        tracer = coretracing.getTracer();
    });
    beforeEach(function () {
        events = [];
    });
    it("should fire events when a span is ended", function (done) {
        assert.equal(tracer[azure_coretracing_pub_1.AzureMonitorSymbol], true);
        var span = tracer.startSpan("test span 1");
        assert.deepEqual(api_1.default.trace.getSpan(api_1.default.context.active()), null);
        assertSpans(events, span);
        done();
    });
});
//# sourceMappingURL=azure-coretracing.spec.js.map