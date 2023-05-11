"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var diagnostic_channel_1 = require("diagnostic-channel");
var mysql_mock_record_1 = require("./util/mysql-mock-record");
var mysql_mock_replay_1 = require("./util/mysql-mock-replay");
var mysql_pub_1 = require("../src/mysql.pub");
var Q = require("q");
require("zone.js");
var assert = require("assert");
var fs = require("fs");
var net = require("net");
var path = require("path");
var Mode;
(function (Mode) {
    Mode[Mode["REPLAY"] = 0] = "REPLAY";
    Mode[Mode["RECORD"] = 1] = "RECORD";
})(Mode || (Mode = {}));
/* tslint:disable-next-line:prefer-const */
var mode = Mode.REPLAY;
describe("mysql", function () {
    var server = net.createServer();
    before(function () {
        mysql_pub_1.enable();
    });
    after(function () { server.close(); });
    it("should fire events when we interact with it, and preserve context", function (done) {
        var traceName = "mysql.trace.json";
        var tracePath = path.join(__dirname, "util", traceName);
        if (mode === Mode.RECORD) {
            diagnostic_channel_1.channel.registerMonkeyPatch("mysql", { versionSpecifier: "*", patch: mysql_mock_record_1.mysqlConnectionRecordPatchFunction });
        }
        else {
            var trace = require(tracePath);
            diagnostic_channel_1.channel.registerMonkeyPatch("mysql", { versionSpecifier: "*", patch: mysql_mock_replay_1.makeMysqlConnectionReplayFunction(trace) });
        }
        diagnostic_channel_1.channel.addContextPreservation(function (cb) { return Zone.current.wrap(cb, "context preservation"); });
        var events = [];
        diagnostic_channel_1.channel.subscribe("mysql", function (event) { return events.push(event); });
        var mysql = require("mysql");
        var pool = mysql.createPool({
            connectionLimit: 2,
            host: "localhost",
            user: "root",
            password: "secret",
            database: "test"
        });
        var z1 = Zone.current.fork({ name: "1" });
        var z2 = Zone.current.fork({ name: "2" });
        var promises = [];
        // We need to ensure that once we run out of connections in the pool, context is still preserved
        z1.run(function () {
            for (var i = 0; i < 2; ++i) {
                promises.push(new Q.Promise(function (resolve, reject) {
                    return pool.query("select 1 as solution", function (err, results) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (results[0].solution !== 1) {
                            reject(new Error("Query gave incorrect result"));
                            return;
                        }
                        if (Zone.current !== z1) {
                            reject("Context not preserved");
                            return;
                        }
                        resolve();
                    });
                }));
            }
        });
        z2.run(function () {
            for (var i = 0; i < 2; ++i) {
                promises.push(new Q.Promise(function (resolve, reject) {
                    return pool.query("select 2 as solution", function (err, results) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (results[0].solution !== 2) {
                            reject(new Error("Query gave incorrect result"));
                            return;
                        }
                        if (Zone.current !== z2) {
                            reject("Context not preserved");
                            return;
                        }
                        resolve();
                    });
                }));
            }
        });
        Q.all(promises).then(function () {
            assert.equal(events.length, 4);
            if (mode === Mode.RECORD) {
                fs.writeFileSync(tracePath, JSON.stringify(mysql_mock_record_1.mysqlCommunication));
            }
            done();
        }).catch(done);
    });
});
//# sourceMappingURL=mysql.spec.js.map