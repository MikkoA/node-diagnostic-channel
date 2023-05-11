"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var channel_1 = require("../src/channel");
var assert = require("assert");
describe("pub/sub", function () {
    afterEach(function () {
        channel_1.channel.reset();
    });
    it("should invoke subscribers", function () {
        var testData = { test: true };
        var invokedData;
        channel_1.channel.subscribe("test", function (data) {
            invokedData = data;
        });
        channel_1.channel.publish("test", testData);
        assert.strictEqual(invokedData.data, testData, "Subscriber called with incorrect values");
    });
    it("should do nothing if there are no subscribers", function () {
        channel_1.channel.publish("ignoredEvent", {});
    });
    it("should invoke subscribers in the right order", function () {
        var invocations = [];
        channel_1.channel.subscribe("test", function () {
            invocations.push(1);
        });
        channel_1.channel.subscribe("test", function () {
            invocations.push(2);
        });
        channel_1.channel.publish("test", {});
        assert.equal(invocations.length, 2);
        assert.equal(invocations[0], 1);
        assert.equal(invocations[1], 2);
    });
    it("should not propagate errors to the publishing method", function () {
        var invoked = false;
        channel_1.channel.subscribe("test", function () {
            invoked = true;
            throw new Error("Errors in subscribers should not propagate to the publisher");
        });
        channel_1.channel.publish("test", {});
        assert(invoked, "Subscriber not called");
    });
    it("should invoke subscribers in the same context as the publish", function () {
        var c1 = { name: "1" };
        var c2 = { name: "2" };
        var context = { name: "root" };
        var invocations = [];
        var subscribeFunction = function () {
            invocations.push(context);
        };
        channel_1.channel.subscribe("test", subscribeFunction);
        context = c1;
        channel_1.channel.publish("test", {});
        context = c2;
        channel_1.channel.publish("test", {});
        assert.equal(invocations.length, 2);
        assert.equal(invocations[0], c1);
        assert.equal(invocations[1], c2);
    });
    it("should preserve contexts when wrapping function is used", function () {
        var c1 = { name: "1" };
        var c2 = { name: "2" };
        var croot = { name: "root" };
        var context = croot;
        channel_1.channel.addContextPreservation(function (cb) {
            var originalContext = context;
            return function () {
                var oldContext = context;
                context = originalContext;
                var ret = cb.apply(this, arguments);
                context = oldContext;
                return ret;
            };
        });
        var invocations = [];
        var subscribeFunction = function () {
            invocations.push(context);
        };
        channel_1.channel.subscribe("test", subscribeFunction);
        var publishFunc = function () {
            channel_1.channel.publish("test", {});
            return true;
        };
        var rootBound = channel_1.channel.bindToContext(publishFunc);
        context = c1;
        var c1Bound = channel_1.channel.bindToContext(publishFunc);
        context = c2;
        assert(rootBound(), "Bound function did not return a value");
        assert(c1Bound());
        assert.equal(invocations.length, 2);
        assert.equal(invocations[0], croot);
        assert.equal(invocations[1], c1);
    });
    it("should report no need for publishing with no subscribers", function () {
        assert(!channel_1.channel.shouldPublish("test"));
    });
    it("should report there is a need for publishing exactly when a subscriber has a filter returning true", function () {
        var filterRetVal = true;
        var subscriberCalled = false;
        channel_1.channel.subscribe("test", function () { subscriberCalled = true; }, function () { return filterRetVal; });
        assert(channel_1.channel.shouldPublish("test"), "Filter returned true but shouldPublish was false");
        assert(!subscriberCalled);
        filterRetVal = false;
        assert(!channel_1.channel.shouldPublish("test"), "Filter returned false but shouldPublish was true");
    });
    it("should report a need for publishing if at least one subscriber reports true", function () {
        var filterRetVals = [false, false, true, false, false];
        var mkFilter = function (index) { return function () { return filterRetVals[index]; }; };
        for (var i = 0; i < filterRetVals.length; ++i) {
            channel_1.channel.subscribe("test", function () { }, mkFilter(i));
        }
        assert.equal(channel_1.channel.shouldPublish("test"), filterRetVals.some(function (v) { return v; }));
        filterRetVals[3] = false;
        assert.equal(channel_1.channel.shouldPublish("test"), filterRetVals.some(function (v) { return v; }));
        filterRetVals[0] = true;
        assert.equal(channel_1.channel.shouldPublish("test"), filterRetVals.some(function (v) { return v; }));
    });
    it("should unsubscribe the correct listener", function () {
        var calls = [];
        var listener1 = function () {
            calls.push(1);
        };
        var listener2 = function () {
            calls.push(2);
        };
        channel_1.channel.subscribe("test", listener1);
        channel_1.channel.subscribe("test", listener2);
        assert(channel_1.channel.unsubscribe("test", listener1), "subscriber not unsubscribed");
        channel_1.channel.publish("test", {});
        assert.equal(calls.length, 1, "Wrong number of listeners invoked");
        assert.equal(calls[0], 2, "Wrong listener invoked");
    });
    it("should unsubscribe the correct listener when filters are involved", function () {
        var calls = [];
        var listener1 = function () {
            calls.push(1);
        };
        var listener2 = function () {
            calls.push(2);
        };
        var filter1 = function () {
            return true;
        };
        var filter2 = function () {
            return true;
        };
        channel_1.channel.subscribe("test", listener1, filter1);
        channel_1.channel.subscribe("test", listener2, filter1);
        channel_1.channel.subscribe("test", listener1, filter2);
        channel_1.channel.subscribe("test", listener2, filter2);
        assert(channel_1.channel.unsubscribe("test", listener1, filter1), "subscriber 1 not unsubscribed");
        assert(channel_1.channel.unsubscribe("test", listener2, filter2), "subscriber 2 not unsubscribed");
        channel_1.channel.publish("test", {});
        assert.equal(calls.length, 2, "Wrong number of listeners invoked");
        assert.deepEqual(calls, [2, 1], "Wrong listeners removed");
    });
    it("should execute callback if module is patched before subscribing", function (done) {
        channel_1.channel.addPatchedModule("testCallback", "1.2.3");
        channel_1.channel.subscribe("testCallback", function () { return; }, channel_1.trueFilter, function (name, version) {
            assert.equal(name, "testCallback");
            assert.equal(version, "1.2.3");
            done();
        });
    });
    it("should execute callback when module is patched", function () {
        var callCount = 0;
        var callback = function (name, version) {
            callCount++;
        };
        channel_1.channel.subscribe("something", function () { return; }, channel_1.trueFilter, callback);
        assert.equal(callCount, 0);
        channel_1.channel.addPatchedModule("something", "4.5.6");
        assert.equal(callCount, 1);
    });
});
//# sourceMappingURL=pubsub.js.map