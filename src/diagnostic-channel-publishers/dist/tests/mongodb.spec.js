"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var diagnostic_channel_1 = require("diagnostic-channel");
var mongodb_core_pub_1 = require("../src/mongodb-core.pub");
var mongodb_pub_1 = require("../src/mongodb.pub");
require("zone.js");
var assert = require("assert");
var Mode;
(function (Mode) {
    Mode[Mode["REPLAY"] = 0] = "REPLAY";
    Mode[Mode["RECORD"] = 1] = "RECORD";
})(Mode || (Mode = {}));
/* tslint:disable-next-line:prefer-const */
var mode = Mode.REPLAY;
describe("mongodb@>3.3", function () {
    before(function () {
        mongodb_core_pub_1.enable();
        mongodb_pub_1.enable();
    });
    it("should fire events when we communicate with a collection, and preserve context", function (done) {
        diagnostic_channel_1.channel.addContextPreservation(function (cb) { return Zone.current.wrap(cb, "context preservation"); });
        var events = [];
        diagnostic_channel_1.channel.subscribe("mongodb", function (event) {
            events.push(event);
        });
        var mongodb = require("mongodb");
        var z1 = Zone.current.fork({ name: "1" });
        z1.run(function () {
            return mongodb.MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function (err, client) {
                if (err) {
                    done(err);
                }
                // ismaster event exists after connecting for 3.0.6+
                if (events.length > 0) {
                    assert.equal(events.length, 1);
                    assert.equal(events[0].data.startedData.command.ismaster, true);
                    assert.equal(events[0].data.event.reply.ismaster, true);
                    assert.equal(events[0].data.succeeded, true);
                    events.length = 0;
                }
                var collection = client.db("testdb").collection("documents");
                if (Zone.current !== z1) {
                    return done(new Error("Context not preserved in connect"));
                }
                var z2 = Zone.current.fork({ name: "2" });
                z2.run(function () {
                    return collection.insertMany([
                        { a: 1 }, { a: 2 }, { a: 3 }
                    ], function (err2, result) {
                        if (err2) {
                            done(err);
                            return;
                        }
                        if (result.result.n !== 3) {
                            done(new Error("Did not insert 3 elements"));
                            return;
                        }
                        if (Zone.current !== z2) {
                            done(new Error("Context not preserved in insert callback"));
                            return;
                        }
                        var z3 = Zone.current.fork({ name: "3" });
                        z3.run(function () {
                            return collection.deleteOne({ a: 3 }).then(function (result2) {
                                if (Zone.current !== z3) {
                                    throw new Error("Context not preserved in delete promise");
                                }
                                if (result2.deletedCount !== 1) {
                                    done(new Error("Did not delete one element"));
                                    return;
                                }
                                assert.equal(events.length, 2);
                                assert.equal(events[0].data.startedData.command.insert, "documents");
                                assert.equal(events[0].data.event.reply.n, 3);
                                assert.equal(events[0].data.succeeded, true);
                                assert.equal(events[1].data.startedData.command.delete, "documents");
                                assert.equal(events[1].data.event.reply.n, 1);
                                assert.equal(events[1].data.succeeded, true);
                            }).then(done, done);
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=mongodb.spec.js.map