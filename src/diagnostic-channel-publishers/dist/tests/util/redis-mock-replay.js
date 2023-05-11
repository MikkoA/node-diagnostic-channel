"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRedisReplayFunction = void 0;
var assert = require("assert");
var EventEmitter = require("events");
function makeRedisReplayFunction(redisCommunication) {
    return function (originalRedis) {
        var ocreateStream = originalRedis.RedisClient.prototype.create_stream;
        originalRedis.RedisClient.prototype.create_stream = function () {
            var _this = this;
            var fakeStream = new EventEmitter();
            fakeStream.setTimeout = fakeStream.setNoDelay = fakeStream.setKeepAlive = fakeStream.destroy = function () { };
            fakeStream.writable = true;
            this.options.stream = fakeStream;
            this.options.stream.write = function (message) {
                var next = redisCommunication.shift();
                if (next && next.send) {
                    assert.equal(message, next.send);
                    if (redisCommunication[0].recv) {
                        setTimeout(function () {
                            fakeStream.emit("data", new Buffer(redisCommunication.shift().recv));
                        }, 0);
                    }
                    return next.ret;
                }
                else {
                    throw new Error("Unexpected write: " + message);
                }
            };
            setTimeout(function () { return _this.options.stream.emit("connect", {}); }, 0);
            return ocreateStream.apply(this, arguments);
        };
        return originalRedis;
    };
}
exports.makeRedisReplayFunction = makeRedisReplayFunction;
//# sourceMappingURL=redis-mock-replay.js.map