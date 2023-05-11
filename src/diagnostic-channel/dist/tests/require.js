"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var assert = require("assert");
var sinon = require("sinon");
var channel_1 = require("../src/channel");
var patchRequire_1 = require("../src/patchRequire");
describe("patchRequire", function () {
    var sandbox;
    var nodeVersionWithoutPrerelease = process.version.match(/v([^-]*)/)[1];
    var originalRequire;
    before(function () {
        originalRequire = require("module").prototype.require;
        sandbox = sinon.sandbox.create();
    });
    afterEach(function () {
        require("module").prototype.require = originalRequire;
        sandbox.restore();
    });
    it("should produce a require-like function", function () {
        var patchedRequire = patchRequire_1.makePatchingRequire({});
        assert.strictEqual(patchedRequire("fs"), require("fs"), "Patched require did not return expected module");
    });
    it("should call a patching function if the version matches", function () {
        var fs = require("fs");
        var mock = {};
        var patchedRequire = patchRequire_1.makePatchingRequire({
            fs: [{
                    versionSpecifier: ">= " + nodeVersionWithoutPrerelease,
                    patch: function (originalModule) {
                        assert.strictEqual(originalModule, fs, "Invoked with wrong package");
                        return mock;
                    }
                }]
        });
        assert.strictEqual(patchedRequire("fs"), mock);
    });
    it("should not call a patching function if the version does not match", function () {
        var fs = require("fs");
        var patchedRequire = patchRequire_1.makePatchingRequire({
            fs: [{
                    versionSpecifier: "< 0.0.0",
                    patch: function (originalModule) {
                        throw new Error("Patching function called with incorrect version");
                    }
                }]
        });
        assert.strictEqual(patchedRequire("fs"), fs);
    });
    it("should call applicable patching functions in turn", function () {
        var fs = require("fs");
        var mock1 = { x: 1 };
        var mock2 = { x: 2 };
        var nodeVersion = nodeVersionWithoutPrerelease;
        var patchedRequire = patchRequire_1.makePatchingRequire({
            fs: [{
                    versionSpecifier: "< " + nodeVersion,
                    patch: function (originalModule) {
                        throw new Error("Patching with wrong version");
                    }
                },
                {
                    versionSpecifier: "" + nodeVersion,
                    patch: function (originalModule) {
                        assert.equal(originalModule, fs);
                        return mock1;
                    }
                },
                {
                    versionSpecifier: ">= " + nodeVersion,
                    patch: function (originalModule) {
                        assert.equal(originalModule, mock1, "Patching out of order!");
                        return mock2;
                    }
                }]
        });
        assert.strictEqual(patchedRequire("fs"), mock2);
    });
    it("should be able to intercept global require if attached correctly", function () {
        var moduleModule = require("module");
        var mock = {};
        var patchedRequire = patchRequire_1.makePatchingRequire({
            fs: [
                {
                    versionSpecifier: ">= " + nodeVersionWithoutPrerelease,
                    patch: function (originalModule) {
                        return mock;
                    }
                }
            ]
        });
        moduleModule.prototype.require = patchedRequire;
        assert.strictEqual(require("fs"), mock, "Global require did not return patched result");
    });
    it("should be able to patch non-built-in packages", function () {
        var moduleModule = require("module");
        var originalSemver = require("semver");
        var mock = {};
        var patchedRequire = patchRequire_1.makePatchingRequire({
            semver: [{
                    versionSpecifier: ">= 5.3.0 < 6.0.0",
                    patch: function (originalModule) {
                        assert.equal(originalModule, originalSemver);
                        return mock;
                    }
                }]
        });
        moduleModule.prototype.require = patchedRequire;
        assert.strictEqual(require("semver"), mock);
    });
    it("should add patched module in channel", function () {
        var patch = sandbox.stub(channel_1.channel, "addPatchedModule");
        var moduleModule = require("module");
        var patchedRequire = patchRequire_1.makePatchingRequire({
            semver: [{
                    versionSpecifier: ">= 5.3.0 < 6.0.0",
                    patch: function (originalModule) {
                        return originalModule;
                    }
                }]
        });
        moduleModule.prototype.require = patchedRequire;
        var semver = require("semver");
        assert.ok(patch.called, "Add path method not executed");
        assert.equal(patch.args[0][0], "semver");
        assert.ok(semver.valid(patch.args[0][1]));
    });
    it("should use publisher name if provided when this is different to package name", function () {
        var patch = sandbox.stub(channel_1.channel, "addPatchedModule");
        var moduleModule = require("module");
        var patchedRequire = patchRequire_1.makePatchingRequire({
            console: [{
                    versionSpecifier: ">0",
                    patch: function (originalModule) {
                        return originalModule;
                    },
                    publisherName: "MyPublisherName"
                }]
        });
        moduleModule.prototype.require = patchedRequire;
        var console = require("console");
        assert.ok(patch.called, "Add path method not executed");
        assert.equal(patch.args[0][0], "MyPublisherName");
    });
});
//# sourceMappingURL=require.js.map