"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var diagnostic_channel_1 = require("diagnostic-channel");
var redis_mock_record_1 = require("./util/redis-mock-record");
var redis_mock_replay_1 = require("./util/redis-mock-replay");
var redis_pub_1 = require("../src/redis.pub");
require("zone.js");
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var Mode;
(function (Mode) {
    Mode[Mode["REPLAY"] = 0] = "REPLAY";
    Mode[Mode["RECORD"] = 1] = "RECORD";
})(Mode || (Mode = {}));
/* tslint:disable-next-line:prefer-const */
var mode = Mode.REPLAY;
describe("redis", function () {
    var _this = this;
    var traceName = "redis.trace.json";
    var tracePath = path.join(__dirname, "util", traceName);
    var client;
    var success = true;
    before(function () {
        redis_pub_1.enable();
        if (mode === Mode.RECORD) {
            diagnostic_channel_1.channel.registerMonkeyPatch("redis", { versionSpecifier: "*", patch: redis_mock_record_1.redisConnectionRecordPatchFunction });
        }
        else {
            var trace = require(tracePath);
            diagnostic_channel_1.channel.registerMonkeyPatch("redis", { versionSpecifier: "*", patch: redis_mock_replay_1.makeRedisReplayFunction(trace) });
        }
    });
    afterEach(function (done) {
        var finish = function () {
            if (_this.ctx.currentTest.state !== "passed") {
                success = false;
            }
            done();
        };
        if (client) {
            client.quit(finish);
        }
        else {
            finish();
        }
    });
    after(function () {
        if (mode === Mode.RECORD && success) {
            fs.writeFileSync(tracePath, JSON.stringify(redis_mock_record_1.redisCommunication));
        }
        if (!success) {
            throw new Error("Not a success");
        }
    });
    it("should fire events when we interact with it, and preserve context", function (done) {
        diagnostic_channel_1.channel.addContextPreservation(function (cb) { return Zone.current.wrap(cb, "context preservation"); });
        var events = [];
        diagnostic_channel_1.channel.subscribe("redis", function (event) { return events.push(event); });
        var redis = require("redis");
        client = redis.createClient("redis://localhost");
        var z1 = Zone.current.fork({ name: "1" });
        z1.run(function () {
            client.get("value", function (err, reply) {
                if (err) {
                    done(err);
                    return;
                }
                if (Zone.current !== z1) {
                    done(new Error("Context not preserved in redis get"));
                    return;
                }
                var initialValue = reply;
                var z2 = Zone.current.fork({ name: "2" });
                z2.run(function () {
                    client.incr("value", function (err2, reply2) {
                        if (err2) {
                            done(err2);
                            return;
                        }
                        if (Zone.current !== z2) {
                            done(new Error("Context not preserved in redis incr"));
                            return;
                        }
                        try {
                            /* tslint:disable-next-line:no-bitwise */
                            assert.equal(reply2, initialValue | 0 + 1, "Mismatch in returned value");
                            assert.equal(events.length, 3);
                            assert.equal(events[0].data.commandObj.command, "info");
                            assert.equal(events[1].data.commandObj.command, "get");
                            assert.equal(events[2].data.commandObj.command, "incr");
                        }
                        catch (e) {
                            done(e);
                            return;
                        }
                        done();
                    });
                });
            });
        });
    });
    it("should record events even if no callback is passed", function (done) {
        diagnostic_channel_1.channel.addContextPreservation(function (cb) { return Zone.current.wrap(cb, "context preservation"); });
        var z1 = Zone.current.fork({ name: "1" });
        var events = [];
        diagnostic_channel_1.channel.subscribe("redis", function (event) {
            events.push(event);
            if (events.length === 2) {
                // Skip the 'info' event which is always first
                if (Zone.current !== z1) {
                    done(new Error("Context not preserved without callback"));
                }
                else {
                    done();
                }
            }
        });
        var redis = require("redis");
        client = redis.createClient("redis://localhost");
        z1.run(function () {
            client.incr("value");
        });
    });
});
//# sourceMappingURL=redis.spec.js.map