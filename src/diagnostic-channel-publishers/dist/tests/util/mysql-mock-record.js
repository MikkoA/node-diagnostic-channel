"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysqlConnectionRecordPatchFunction = exports.mysqlCommunication = void 0;
var path = require("path");
exports.mysqlCommunication = [];
var mysqlConnectionRecordPatchFunction = function (originalMysql, originalMysqlPath) {
    var connectionClass = require(path.dirname(originalMysqlPath) + "/lib/Connection");
    var oconnect = connectionClass.prototype.connect;
    connectionClass.prototype.connect = function () {
        var ret = oconnect.apply(this, arguments);
        // Mysql uses a pool of connections,
        // so we track each pool as an independant thread
        var thread = [];
        exports.mysqlCommunication.push(thread);
        this._socket.prependListener("data", function (data) {
            thread.push({ recv: data });
        });
        var owrite = this._socket.write;
        this._socket.write = function (data) {
            thread.push({ send: data });
            return owrite.apply(this, arguments);
        };
        return ret;
    };
    return originalMysql;
};
exports.mysqlConnectionRecordPatchFunction = mysqlConnectionRecordPatchFunction;
//# sourceMappingURL=mysql-mock-record.js.map