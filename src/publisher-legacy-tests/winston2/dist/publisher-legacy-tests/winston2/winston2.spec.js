"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var assert = require("assert");
var diagnostic_channel_1 = require("diagnostic-channel");
var winston_pub_1 = require("../../diagnostic-channel-publishers/src/winston.pub");
function compareWinstonData(actual, expected) {
    assert.strictEqual(actual.message, expected.message, "messages are not equal");
    // meta is an object, but we can always use the same reference
    assert.strictEqual(actual.meta, expected.meta, "meta objects are not equal");
    assert.strictEqual(actual.level, expected.level, "levels are not equal");
    assert.strictEqual(actual.levelKind, expected.levelKind, "level kinds are not equal");
}
describe("winston@2.x", function () {
    var winston;
    var actual = null;
    var listener = function (event) {
        actual = event.data;
    };
    before(function () {
        winston_pub_1.enable();
        winston = require("winston");
    });
    beforeEach(function () {
        diagnostic_channel_1.channel.subscribe("winston", listener);
    });
    afterEach(function () {
        diagnostic_channel_1.channel.unsubscribe("winston", listener);
        actual = null;
    });
    it("should intercept the default logger", function () {
        var expected = { message: "should intercept the default logger", meta: {}, level: "info", levelKind: "npm" };
        winston.info(expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
    it("should intercept new loggers", function () {
        var expected = { message: "should intercept a new logger", meta: { testing: "new loggers" }, level: "info", levelKind: "npm" };
        var loggerWithoutFilter = new winston.Logger({
            transports: [new winston.transports.Console()]
        });
        loggerWithoutFilter.info(expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
    it("should intercept loggers with pre-configured filters", function () {
        var expected = { message: "unfiltered", meta: { testing: "new loggers" }, level: "info", levelKind: "npm" };
        var filteredMessage = "filtered";
        var logger = new winston.Logger({
            filters: [
                function (level, message, meta) { return filteredMessage; }
            ],
            transports: [new winston.transports.Console()]
        });
        logger.log("info", "unfiltered", expected.meta);
        expected.message = filteredMessage;
        compareWinstonData(actual, expected);
    });
    it("should always publish the most-filtered, most-rewritten message", function () {
        var logger = new winston.Logger({
            filters: [
                function (level, message, meta) { return "kinda filtered"; }
            ],
            rewriters: [
                function (level, message, meta) { meta.rewritten = 1; return meta; }
            ],
            transports: [new winston.transports.Console()]
        });
        var rewritten2 = { rewritten: 2 };
        logger.filters.push(function () { return "more filtered"; });
        logger.rewriters.push(function (level, message, meta) { return rewritten2; });
        logger.log("info", "unfiltered", {});
        compareWinstonData(actual, { message: "more filtered", meta: rewritten2, level: "info", levelKind: "npm" });
        var rewritten3 = { rewritten: 3 };
        logger.filters.push(function () { return "even more filtered"; });
        logger.rewriters.push(function (level, message, meta) { return rewritten3; });
        logger.log("info", "unfiltered", {});
        compareWinstonData(actual, { message: "even more filtered", meta: rewritten3, level: "info", levelKind: "npm" });
    });
    it("should track changes to logging levels", function () {
        var expected = { message: "should intercept the default logger", meta: {}, level: "info", levelKind: "npm" };
        var logger = new winston.Logger({
            transports: [
                new winston.transports.Console({
                    name: "default-console",
                    level: "info"
                }),
                new winston.transports.Console({
                    name: "levels-console",
                    level: "l2"
                })
            ]
        });
        logger.info(expected.message, expected.meta);
        compareWinstonData(actual, expected);
        logger.setLevels(winston.config.syslog.levels);
        expected.levelKind = "syslog";
        expected.level = "warning";
        logger.warning(expected.message, expected.meta);
        compareWinstonData(actual, expected);
        logger.setLevels({ l0: 0, l1: 1, l2: 2, l3: 3 });
        expected.levelKind = "unknown";
        expected.level = "l2";
        logger.log("l2", expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
});
//# sourceMappingURL=winston2.spec.js.map