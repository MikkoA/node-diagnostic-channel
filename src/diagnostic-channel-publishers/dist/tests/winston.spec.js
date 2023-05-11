"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var assert = require("assert");
var diagnostic_channel_1 = require("diagnostic-channel");
var winston_pub_1 = require("../src/winston.pub");
function compareWinstonData(actual, expected) {
    assert.strictEqual(actual.message, expected.message, "messages are not equal");
    // // meta is an object, but we can always use the same reference
    assert.deepEqual(actual.meta, expected.meta, "meta objects are not equal");
    assert.strictEqual(actual.level, expected.level, "levels are not equal");
    assert.strictEqual(actual.levelKind, expected.levelKind, "level kinds are not equal");
}
describe("winston", function () {
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
        var expected = { message: "should intercept a new logger", meta: { testing: "new loggers", another: "meta field" }, level: "info", levelKind: "npm" };
        var loggerWithoutFilter = new winston.createLogger({
            transports: [new winston.transports.Console()]
        });
        loggerWithoutFilter.info(expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
    it("should send Error message as Error instance", function () {
        var expected = { message: new Error("a caught error"), meta: { foo: "bar" }, level: "info", levelKind: "npm" };
        var logger = new winston.createLogger({
            transports: [new winston.transports.Console()]
        });
        logger.info(expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
    it("should send string message as string", function () {
        var expected = { message: "test message", meta: { foo: "bar" }, level: "info", levelKind: "npm" };
        var logger = new winston.createLogger({
            transports: [new winston.transports.Console()]
        });
        logger.info(expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
    it("should intercept loggers with pre-configured filters", function () {
        var expected = { message: "unfiltered", meta: { testing: "new loggers", another: "meta field" }, level: "info", levelKind: "npm" };
        var filteredMessage = "filtered";
        var filterMessage = winston.format(function (info, opts) {
            info.message = filteredMessage;
            return info;
        });
        var logger = new winston.createLogger({
            format: winston.format.combine(filterMessage(), winston.format.json()),
            transports: [new winston.transports.Console()]
        });
        logger.log("info", "unfiltered", expected.meta);
        expected.message = filteredMessage;
        compareWinstonData(actual, expected);
    });
    it("should always publish the most-filtered, most-rewritten message", function () {
        var expected = { message: "unfiltered", meta: { rewritten: 0 }, level: "info", levelKind: "npm" };
        var filterMessage = winston.format(function (info, opts) {
            info.message = "filtered";
            return info;
        });
        var rewriter = winston.format(function (info, opts) {
            info.meta = info.meta || {};
            info.meta.rewritten = 1;
            return info;
        });
        var logger = new winston.createLogger({
            format: winston.format.combine(filterMessage(), rewriter(), winston.format.json()),
            transports: [new winston.transports.Console()]
        });
        var filterMessage2 = winston.format(function (info, opts) {
            info.message = "more filtered";
            return info;
        });
        var rewriter2 = winston.format(function (info, opts) {
            info.meta = info.meta || {};
            info.meta.rewritten = 2;
            return info;
        });
        logger.configure({
            format: winston.format.combine(filterMessage2(), rewriter2(), winston.format.json()),
            transports: [new winston.transports.Console()]
        });
        logger.log("info", "unfiltered", {});
        compareWinstonData(actual, { message: "more filtered", meta: { rewritten: 2 }, level: "info", levelKind: "npm" });
        var filterMessage3 = winston.format(function (info, opts) {
            info.message = "even more filtered";
            return info;
        });
        var rewriter3 = winston.format(function (info, opts) {
            info.meta = info.meta || {};
            info.meta.rewritten = 3;
            return info;
        });
        logger.configure({
            format: winston.format.combine(filterMessage3(), rewriter3(), winston.format.json()),
            transports: [new winston.transports.Console()]
        });
        logger.log("info", "unfiltered", {});
        compareWinstonData(actual, { message: "even more filtered", meta: { rewritten: 3 }, level: "info", levelKind: "npm" });
    });
    it("should track correct metadata for child loggers", function () {
        var expected = { message: "test message", level: "error", levelKind: "npm", meta: { some: "meta field", another: "metafield" } };
        var logger = new winston.createLogger({
            transports: [
                new winston.transports.Console()
            ]
        });
        var childLogger = logger.child({
            some: "meta field"
        });
        childLogger.error("test message", { another: "metafield" });
        compareWinstonData(actual, expected);
    });
    it("should get correct levelKind even if colorized", function () {
        var expected = { message: "test message", level: "error", levelKind: "npm", meta: {} };
        var logger = new winston.createLogger({
            format: winston.format.combine(winston.format.colorize()),
            transports: [
                new winston.transports.Console()
            ]
        });
        logger.error("test message");
        compareWinstonData(actual, expected);
    });
    it("should track different syslog logging levels", function () {
        var expected = { message: "should intercept the default logger", meta: {}, level: "info", levelKind: "npm" };
        var logger = new winston.createLogger({
            levels: winston.config.syslog.levels,
            transports: [
                new winston.transports.Console()
            ]
        });
        expected.levelKind = "syslog";
        expected.level = "warning";
        logger.log(expected.level, expected.message, expected.meta);
        compareWinstonData(actual, expected);
        expected.level = "alert";
        logger.alert(expected.message, expected.meta);
        compareWinstonData(actual, expected);
    });
    it("should not throw when createLogger is created without arguments", function () {
        assert.doesNotThrow(function () {
            var logger = new winston.createLogger();
            assert.ok(logger);
        });
    });
    it("should track custom logging levels", function () {
        var expected = { message: "should intercept the default logger", meta: { some: "meta" }, level: "info", levelKind: "unknown" };
        var customLevels = {
            foo: 0,
            bar: 1,
            baz: 2,
            foobar: 3
        };
        var logger = winston.createLogger({
            levels: customLevels,
            transports: [
                new winston.transports.Console({
                    level: "foobar"
                })
            ]
        });
        for (var level in customLevels) {
            if (customLevels.hasOwnProperty) {
                expected.level = level;
                logger.log(level, expected.message, expected.meta);
                compareWinstonData(actual, expected);
                logger[level](expected.message, expected.meta);
                compareWinstonData(actual, expected);
            }
        }
    });
});
//# sourceMappingURL=winston.spec.js.map