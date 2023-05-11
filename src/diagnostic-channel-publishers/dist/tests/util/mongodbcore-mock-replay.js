"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongodbcoreConnectionReplayPatchFunction = void 0;
var events_1 = require("events");
var makeMongodbcoreConnectionReplayPatchFunction = function (mongoCommunication) {
    return function (originalMongoCore) {
        var oConnect = originalMongoCore.Connection.prototype.connect;
        originalMongoCore.Connection.prototype.connect = function () {
            var _this = this;
            // This is very much hackish.
            // We want to substitute the connection that the connect function tries to make,
            // and replace it with our own EventEmitter.
            // To do this, we tweak the EventEmitter to have the relevant methods, and we
            // add a getter with no setter to 'this' so that the method does not overwrite it.
            var connection = new events_1.EventEmitter();
            connection.setKeepAlive = connection.setTimeout = connection.setNoDelay = connection.end = function () { };
            connection.writable = true;
            connection.destroy = function () {
                _this.connection.destroyed = true;
            };
            Object.defineProperty(this, "connection", {
                get: function () { return connection; },
                set: function () { },
                configurable: true
            });
            oConnect.apply(this, arguments);
            setTimeout(function () {
                connection.emit("connect", {});
            }, 0);
        };
        originalMongoCore.Connection.prototype.write = function (buffer) {
            var _this = this;
            var next = mongoCommunication.shift();
            if (next.send) {
                var expected = new Buffer(next.send);
                if (mongoCommunication[0].recv) {
                    var data_1 = new Buffer(mongoCommunication.shift().recv);
                    setTimeout(function () {
                        _this.connection.emit("data", data_1);
                    }, 0);
                }
                /*
                // TODO: add additional validation that the test doesn't get broken by changes in mongo's communication approach?
                else {
                    console.log(expected.toString());
                    console.log(buffer.toString());
                    throw new Error("Mismatched buffers");
                }*/
            }
            else {
                throw new Error("Unexpected write");
            }
        };
        return originalMongoCore;
    };
};
exports.makeMongodbcoreConnectionReplayPatchFunction = makeMongodbcoreConnectionReplayPatchFunction;
//# sourceMappingURL=mongodbcore-mock-replay.js.map