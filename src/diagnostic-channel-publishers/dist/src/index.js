"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.enable = exports.tedious = exports.pgPool = exports.pg = exports.winston = exports.redis = exports.mysql = exports.mongodb = exports.mongodbCore = exports.console = exports.bunyan = exports.azuresdk = void 0;
var azuresdk = require("./azure-coretracing.pub");
exports.azuresdk = azuresdk;
var bunyan = require("./bunyan.pub");
exports.bunyan = bunyan;
var consolePub = require("./console.pub");
exports.console = consolePub;
var mongodbCore = require("./mongodb-core.pub");
exports.mongodbCore = mongodbCore;
var mongodb = require("./mongodb.pub");
exports.mongodb = mongodb;
var mysql = require("./mysql.pub");
exports.mysql = mysql;
var pgPool = require("./pg-pool.pub");
exports.pgPool = pgPool;
var pg = require("./pg.pub");
exports.pg = pg;
var redis = require("./redis.pub");
exports.redis = redis;
var tedious = require("./tedious.pub");
exports.tedious = tedious;
var winston = require("./winston.pub");
exports.winston = winston;
function enable() {
    bunyan.enable();
    consolePub.enable();
    mongodbCore.enable();
    mongodb.enable();
    mysql.enable();
    pg.enable();
    pgPool.enable();
    redis.enable();
    winston.enable();
    azuresdk.enable();
    tedious.enable();
}
exports.enable = enable;
//# sourceMappingURL=index.js.map