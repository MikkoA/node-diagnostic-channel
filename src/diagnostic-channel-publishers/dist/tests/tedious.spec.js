"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var diagnostic_channel_1 = require("diagnostic-channel");
require("zone.js");
var tedious_pub_1 = require("../src/tedious.pub");
var config = {
    server: "localhost",
    options: {
        port: 14330,
        database: "master"
    },
    authentication: {
        type: "default",
        options: {
            userName: "sa",
            password: "yourStrong(!)Password"
        }
    }
};
describe("tedious@6.x", function () {
    var tedious;
    var actual = null;
    var listener = function (event) {
        actual = event.data;
    };
    var connection;
    before(function (done) {
        tedious_pub_1.enable();
        diagnostic_channel_1.channel.addContextPreservation(function (cb) { return Zone.current.wrap(cb, "context preservation"); });
        tedious = require("tedious");
        connection = new tedious.Connection(config);
        connection.on("connect", function (err) {
            done(err);
        });
    });
    beforeEach(function () {
        diagnostic_channel_1.channel.subscribe("tedious", listener);
    });
    afterEach(function () {
        actual = null;
    });
    it("should intercept execSql", function (done) {
        var expectation = {
            query: {
                text: "select 42, 'hello world'"
            },
            database: {
                host: "localhost",
                port: "14330"
            },
            duration: null,
            error: null,
            result: {
                rowCount: 1,
                rows: []
            }
        };
        var child = Zone.current.fork({ name: "child" });
        var handler = function (err, rowCount) {
            assert.ok(actual.duration > 0);
            assert.equal(err, null);
            assert.deepEqual(Zone.current, child);
            assert.deepEqual(actual, __assign(__assign({}, expectation), { duration: actual.duration }));
            done();
        };
        var request = new tedious.Request("select 42, 'hello world'", handler);
        child.run(function () {
            connection.execSql(request);
        });
    });
});
//# sourceMappingURL=tedious.spec.js.map