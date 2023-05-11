"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var assert = require("assert");
/* tslint:disable:no-console */
var console_pub_1 = require("../src/console.pub");
var diagnostic_channel_1 = require("diagnostic-channel");
describe("Console", function () {
    var moduleModule = require("module");
    var originalRequire = moduleModule.prototype.require;
    var originalConsoleDescriptor = Object.getOwnPropertyDescriptor(global, "console");
    before(function () {
        diagnostic_channel_1.channel.reset();
    });
    afterEach(function () {
        diagnostic_channel_1.channel.reset();
        moduleModule.prototype.require = originalRequire;
        Object.defineProperty(global, "console", originalConsoleDescriptor);
    });
    it("should intercept console.log", function () {
        var eventEmitted;
        diagnostic_channel_1.channel.subscribe("console", function (event) { return eventEmitted = event; });
        moduleModule.prototype.require = diagnostic_channel_1.makePatchingRequire({ console: [console_pub_1.console] });
        console.log("Before mocking");
        assert(!eventEmitted, "Nothing should be hooked up yet");
        var testLogMessage = "After mocking";
        require("console");
        console.log(testLogMessage);
        assert(eventEmitted, "Event not published");
        assert.equal(eventEmitted.data.message.replace("\n", ""), testLogMessage);
        assert(!eventEmitted.data.stderr);
    });
    it("should be safe to console.log within a console subscriber", function () {
        var eventEmitted;
        diagnostic_channel_1.channel.subscribe("console", function (event) {
            console.log("Logging within subscriber: " + event.data.message);
            eventEmitted = event;
        });
        moduleModule.prototype.require = diagnostic_channel_1.makePatchingRequire({ console: [console_pub_1.console] });
        require("console");
        console.log("Checking for crashes");
        assert(eventEmitted, "Event not published");
    });
});
//# sourceMappingURL=console.spec.js.map