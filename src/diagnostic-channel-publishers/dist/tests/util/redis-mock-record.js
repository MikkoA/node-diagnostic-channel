"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionRecordPatchFunction = exports.redisCommunication = void 0;
exports.redisCommunication = [];
var redisConnectionRecordPatchFunction = function (originalRedis) {
    var ocreateStream = originalRedis.RedisClient.prototype.create_stream;
    originalRedis.RedisClient.prototype.create_stream = function () {
        var createRetval = ocreateStream.apply(this, arguments);
        this.stream.prependListener("data", function (data) {
            exports.redisCommunication.push({ recv: data });
        });
        this.stream.on("drain", function (data) {
            exports.redisCommunication.push({ drain: { data: data } });
        });
        var oStreamWrite = this.stream.write;
        this.stream.write = function (data) {
            var ret = oStreamWrite.apply(this, arguments);
            exports.redisCommunication.push({ send: data, ret: ret });
            return ret;
        };
        return createRetval;
    };
    return originalRedis;
};
exports.redisConnectionRecordPatchFunction = redisConnectionRecordPatchFunction;
//# sourceMappingURL=redis-mock-record.js.map