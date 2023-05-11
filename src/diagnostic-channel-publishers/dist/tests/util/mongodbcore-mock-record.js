"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongodbcoreConnectionRecordPatchFunction = exports.mongoCommunication = void 0;
exports.mongoCommunication = [];
var mongodbcoreConnectionRecordPatchFunction = function (originalMongoCore) {
    var oconnect = originalMongoCore.Connection.prototype.connect;
    originalMongoCore.Connection.prototype.connect = function () {
        var ret = oconnect.apply(this, arguments);
        this.connection.on("data", function (data) {
            exports.mongoCommunication.push({ recv: data });
        });
        return ret;
    };
    var owrite = originalMongoCore.Connection.prototype.write;
    originalMongoCore.Connection.prototype.write = function (buffer) {
        exports.mongoCommunication.push({ send: buffer });
        return owrite.apply(this, arguments);
    };
    return originalMongoCore;
};
exports.mongodbcoreConnectionRecordPatchFunction = mongodbcoreConnectionRecordPatchFunction;
//# sourceMappingURL=mongodbcore-mock-record.js.map