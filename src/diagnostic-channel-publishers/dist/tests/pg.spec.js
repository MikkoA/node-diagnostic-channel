"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var diagnostic_channel_1 = require("diagnostic-channel");
var q_1 = require("q");
require("zone.js");
var pg_pool_pub_1 = require("../src/pg-pool.pub");
var pg_pub_1 = require("../src/pg.pub");
describe("pg@8.x", function () {
    var pg;
    var actual = null;
    var client;
    var pool;
    var listener = function (event) {
        actual = event.data;
    };
    var dbSettings = {
        user: "postgres",
        password: "test",
        database: "postgres",
        host: "127.0.0.1",
        port: 5455
    };
    var checkSuccess = function (data) {
        try {
            assert(data, "No data argument was provided to checkSuccess");
            assert(actual, "No events were published to the channel");
            if (data.err) {
                return data.err;
            }
            assert.equal(data.err, actual.error, "Invalid error object");
            assert.equal(data.res.rowCount, actual.result.rowCount, "query and actual have different number of rows");
            assert.equal(actual.database.host, dbSettings.host, "actual has incorrect host");
            assert(actual.duration > 0, "actual has non-positive duration");
            if (data.text) {
                assert.equal(actual.query.text, data.text, "actual has incorrect query text");
            }
            else if (data.preparable) {
                assert.equal(actual.query.preparable.text, data.preparable.text, "actual has incorrect preparable text");
                assert.deepEqual(actual.query.preparable.args, data.preparable.args, "actual has incorrect preparable arguments");
            }
            else {
                assert.equal(actual.query.plan, data.plan, "actual has incorrect query plan");
            }
            assert.equal(data.zone, Zone.current, "Context was not preserved");
            actual = null;
            return null;
        }
        catch (e) {
            return e;
        }
    };
    var checkFailure = function (data) {
        try {
            assert(data, "No data argument was provided to checkSuccess");
            assert(actual, "No events were published to the channel");
            if (!data.err) {
                return new Error("No error returned by bad query");
            }
            assert.equal(data.err, actual.error, "Error returned to callback does not match actual error");
            assert.equal(data.zone, Zone.current, "Context was not preserved");
            actual = null;
            return null;
        }
        catch (e) {
            return e;
        }
    };
    before(function () {
        pg_pub_1.enable();
        pg_pool_pub_1.enable();
        diagnostic_channel_1.channel.addContextPreservation(function (cb) { return Zone.current.wrap(cb, "context preservation"); });
        pg = require("pg");
        pool = new pg.Pool({
            user: dbSettings.user,
            password: dbSettings.password,
            database: dbSettings.database,
            host: dbSettings.host,
            port: dbSettings.port,
            max: 2
        });
    });
    beforeEach(function (done) {
        diagnostic_channel_1.channel.subscribe("postgres", listener);
        client = new pg.Client(dbSettings);
        client.connect(done);
    });
    afterEach(function (done) {
        diagnostic_channel_1.channel.unsubscribe("postgres", listener);
        actual = null;
        client.end(done);
    });
    after(function (done) {
        pool.end(done);
    });
    it("should not return a promise if no callback is provided", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            var res = client.query("SELECT NOW()", function (e1, r1) {
                var bad = checkSuccess({
                    res: r1,
                    err: e1,
                    zone: child,
                    text: "SELECT NOW()"
                });
                if (bad) {
                    return done(bad);
                }
                client.query("SELECT nonexistent", function (e2, r2) {
                    done(checkFailure({
                        res: r2,
                        err: e2,
                        zone: child,
                        preparable: {
                            text: "SELECT $1",
                            args: ["0"]
                        }
                    }));
                });
            });
            assert.equal(res, undefined, "No promise is returned");
        });
    });
    it("should intercept client.query(text, values, callback)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query("SELECT $1::text", ["0"], function (e1, r1) {
                var bad = checkSuccess({
                    res: r1,
                    err: e1,
                    zone: child,
                    preparable: {
                        text: "SELECT $1::text",
                        args: ["0"]
                    }
                });
                if (bad) {
                    return done(bad);
                }
                client.query("SELECT nonexistant", ["0"], function (e2, r2) {
                    done(checkFailure({
                        res: r2,
                        err: e2,
                        zone: child,
                        preparable: {
                            text: "SELECT $1",
                            args: ["0"]
                        }
                    }));
                });
            });
        });
    });
    it("should intercept client.query(text, callback)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query("SELECT NOW()", function (e1, r1) {
                var bad = checkSuccess({
                    res: r1,
                    err: e1,
                    zone: child,
                    text: "SELECT NOW()"
                });
                if (bad) {
                    return done(bad);
                }
                client.query("SELECT nonexistent", function (e2, r2) {
                    done(checkFailure({
                        res: r2,
                        err: e2,
                        zone: child,
                        preparable: {
                            text: "SELECT $1",
                            args: ["0"]
                        }
                    }));
                });
            });
        });
    });
    it("should intercept client.query({text, callback})", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query({ text: "SELECT NOW()", callback: function (e1, r1) {
                    var bad = checkSuccess({
                        res: r1,
                        err: e1,
                        zone: child,
                        text: "SELECT NOW()"
                    });
                    if (bad) {
                        return done(bad);
                    }
                    client.query({ text: "SELECT nonexistent", callback: function (e2, r2) {
                            done(checkFailure({
                                res: r2,
                                err: e2,
                                zone: child,
                                preparable: {
                                    text: "SELECT $1",
                                    args: ["0"]
                                }
                            }));
                        } });
                } });
        });
    });
    it("should intercept client.query({text}, callback)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query({ text: "SELECT NOW()" }, function (e1, r1) {
                var bad = checkSuccess({
                    res: r1,
                    err: e1,
                    zone: child,
                    text: "SELECT NOW()"
                });
                if (bad) {
                    return done(bad);
                }
                client.query({ text: "SELECT nonexistent" }, function (e2, r2) {
                    done(checkFailure({
                        res: r2,
                        err: e2,
                        zone: child,
                        preparable: {
                            text: "SELECT $1",
                            args: ["0"]
                        }
                    }));
                });
            });
        });
    });
    it("should intercept client.query(text, values)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query("SELECT $1::text", ["0"]).then(function (res) {
                var bad = checkSuccess({
                    res: res,
                    err: null,
                    zone: child,
                    preparable: {
                        text: "SELECT $1::text",
                        args: ["0"]
                    }
                });
                if (bad) {
                    throw bad;
                }
            }).then(function () {
                return client.query("SELECT nonexistant", ["0"]).then(function () {
                    assert.equal(child, Zone.current, "Context was not preserved");
                    throw new Error("bad query was successful");
                }, function (err) {
                    var bad = checkFailure({
                        res: null,
                        err: err,
                        zone: child,
                        preparable: {
                            text: "SELECT $1",
                            args: ["0"]
                        }
                    });
                    if (bad) {
                        throw bad;
                    }
                });
            }).then(done, done);
        });
    });
    it("should intercept client.query({text, values})", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query({ text: "SELECT $1::text", values: ["0"] }).then(function (res) {
                var bad = checkSuccess({
                    res: res,
                    err: null,
                    zone: child,
                    preparable: {
                        text: "SELECT $1::text",
                        args: ["0"]
                    }
                });
                if (bad) {
                    throw bad;
                }
            }).then(function () {
                return client.query({ text: "SELECT nonexistant", values: ["0"] }).then(function () {
                    assert.equal(child, Zone.current, "Context was not preserved");
                    throw new Error("bad query was successful");
                }, function (err) {
                    var bad = checkFailure({
                        res: null,
                        err: err,
                        zone: child,
                        preparable: {
                            text: "SELECT $1",
                            args: ["0"]
                        }
                    });
                    if (bad) {
                        throw bad;
                    }
                });
            }).then(done, done);
        });
    });
    it("should intercept client.query(text)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            client.query("SELECT NOW()").then(function (res) {
                var bad = checkSuccess({
                    res: res,
                    err: null,
                    zone: child,
                    text: "SELECT NOW()"
                });
                if (bad) {
                    throw bad;
                }
            }).then(function () {
                return client.query("SELECT nonexistent").then(function () {
                    assert.equal(child, Zone.current, "Context was not preserved");
                    throw new Error("bad query was successful");
                }, function (err) {
                    var bad = checkFailure({
                        res: null,
                        err: err,
                        zone: child,
                        text: "SELECT nonexistent"
                    });
                    if (bad) {
                        throw bad;
                    }
                });
            }).then(done, done);
        });
    });
    it("should intercept pool.query(text)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            pool.query("SELECT NOW()").then(function (res) {
                done(checkSuccess({
                    res: res,
                    err: null,
                    zone: child,
                    text: "SELECT NOW()"
                }));
            }, done);
        });
    });
    it("should intercept pool.query(text, values)", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            pool.query("SELECT $1::text", ["0"]).then(function (res) {
                done(checkSuccess({
                    res: res,
                    err: null,
                    zone: child,
                    preparable: {
                        text: "SELECT $1::text",
                        args: ["0"]
                    }
                }));
            }, done);
        });
    });
    it("should intercept pool.connect() with too many clients", function test(done) {
        var child = Zone.current.fork({ name: "child" });
        child.run(function () {
            var c1err = new Error("c1err not assigned");
            pool.connect(function (e1, c1) {
                if (e1) {
                    return done(e1);
                }
                pool.connect(function (e2, c2) {
                    if (e2) {
                        return done(e2);
                    }
                    pool.connect(function (e3, c3) {
                        if (e3) {
                            return done(e3);
                        }
                        c3.query("SELECT NOW()", function (err, res) {
                            c3.release(err);
                            c2.release();
                            done(checkSuccess({
                                res: res,
                                err: err,
                                zone: child,
                                text: "SELECT NOW()"
                            }));
                        });
                    });
                });
                c1.query("SELECT NOW()").then(function (res) {
                    c1.release();
                    c1err = checkSuccess({
                        res: res,
                        err: null,
                        zone: child,
                        text: "SELECT NOW()"
                    });
                }, function (e) {
                    c1.release();
                    c1err = e;
                });
            });
        });
    });
    it("should handle the same callback being given to multiple client.query()s", function test(done) {
        var events = 0;
        var handlers = 0;
        var counter = function (event) {
            events += 1;
        };
        var queryHandler = function (err, res) {
            if (err) {
                throw err;
            }
            handlers += 1;
            if (handlers === 5) {
                assert.equal(events, 6, "subscriber called too many times");
                assert.equal(handlers, 5, "callback called too many times");
                done();
            }
        };
        var config = {
            text: "SELECT NOW()",
            callback: queryHandler
        };
        diagnostic_channel_1.channel.subscribe("postgres", counter);
        client.query("SELECT NOW()");
        client.query("SELECT NOW()", queryHandler);
        client.query(config);
        client.query(config);
        client.query("SELECT NOW()", config.callback);
        client.query("SELECT NOW()", config.callback);
        // client.query("SELECT NOW()")
        // .then(() => {
        //     assert.equal(events, 6, "subscriber called too many times");
        //     assert.equal(handlers, 5, "callback called too many times");
        //     channel.unsubscribe("postgres", counter);
        // }).then(done, done);
    });
    it("should preserve correct zones even when using the same callback in client.query()", function test(done) {
        function handler(err, res) {
            zoneQueue.push(Zone.current);
            if (zoneQueue.length >= 2) {
                assert.ok(zoneQueue[0]);
                assert.ok(z1);
                assert.ok(zoneQueue[1]);
                assert.ok(z2);
                assert.equal(zoneQueue[0], z1, "First zoneQueue item is not z1");
                assert.equal(zoneQueue[1], z2, "Second zoneQueue item is not z2");
                done();
            }
        }
        var zoneQueue = [];
        var z1 = Zone.current.fork({ name: "z1" });
        var z2 = Zone.current.fork({ name: "z2" });
        z1.run(function () {
            return client.query("SELECT NOW()", handler);
        });
        z2.run(function () {
            return client.query("SELECT NOW()", handler);
        });
    });
    it("should preserve correct zones even when using the same callback in pool.connect()", function test(done) {
        function handler(err, _, release) {
            if (err) {
                rejecter(err);
            }
            zoneQueue.push(Zone.current);
            release();
            resolver();
        }
        var resolver;
        var rejecter;
        var zoneQueue = [];
        var z1 = Zone.current.fork({ name: "z1" });
        var z2 = Zone.current.fork({ name: "z2" });
        var p = new pg.Pool(dbSettings);
        z1.run(function () {
            return new q_1.Promise(function (res, rej) {
                resolver = res;
                rejecter = rej;
                p.connect(handler);
            });
        }).then(function () {
            return z2.run(function () {
                return new q_1.Promise(function (res, rej) {
                    resolver = res;
                    rejecter = rej;
                    p.connect(handler);
                });
            });
        }).then(function () {
            assert.equal(zoneQueue[0], z1, "First zoneQueue item is not z1");
            assert.equal(zoneQueue[1], z2, "Second zoneQueue item is not z2");
            return p.end();
        }).then(done, done);
    });
    it("should let the pg module throw its own errors with bad arguments", function test() {
        function assertPgError(e) {
            var src = e.stack.split("\n").map(function (el) { return el.trim(); })[1];
            return /node_modules[/\\]pg/.test(src);
        }
        assert.throws(function () { return client.query(); }, assertPgError, "query with no arguments did not throw from pg");
        // assert.doesNotThrow(() => client.query(1, ["0"], () => null), "query with invalid text should not immediately throw");
        assert.doesNotThrow(function () { return client.query({ random: "object" }, undefined, function () { return null; }); }, "query with invalid config object did not throw from pg");
    });
});
//# sourceMappingURL=pg.spec.js.map