"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMysqlConnectionReplayFunction = void 0;
var EventEmitter = require("events");
var path = require("path");
function makeMysqlConnectionReplayFunction(mysqlCommunication) {
    return function (originalMysql, originalMysqlPath) {
        var connectionClass = require(path.dirname(originalMysqlPath) + "/lib/Connection");
        var oconnect = connectionClass.prototype.connect;
        connectionClass.prototype.connect = function () {
            var _this = this;
            if (!this._connectCalled) {
                var thread_1 = mysqlCommunication.shift();
                var connection_1 = new EventEmitter();
                connection_1.setKeepAlive = connection_1.setTimeout = connection_1.setNoDelay = connection_1.end = function () { };
                connection_1.writable = true;
                connection_1.destroy = function () {
                    _this.connection.destroyed = true;
                };
                Object.defineProperty(this, "_socket", {
                    get: function () { return connection_1; },
                    set: function () { },
                    configurable: true
                });
                connection_1.write = function () {
                    var next = thread_1.shift();
                    if (next.send) {
                        if (thread_1[0].recv) {
                            setTimeout(function () { return connection_1.emit("data", new Buffer(thread_1.shift().recv)); }, 0);
                        }
                        return true;
                    }
                    else {
                        throw new Error("Unexpected write");
                    }
                };
                setTimeout(function () {
                    connection_1.emit("connect", {});
                    // The mysql client expects the server to push data as the client connects, not only after a query from the client
                    if (thread_1[0].recv) {
                        setTimeout(function () {
                            connection_1.emit("data", new Buffer(thread_1.shift().recv));
                        }, 0);
                    }
                }, 0);
            }
            return oconnect.apply(this, arguments);
        };
        return originalMysql;
    };
}
exports.makeMysqlConnectionReplayFunction = makeMysqlConnectionReplayFunction;
//# sourceMappingURL=mysql-mock-replay.js.map