"use strict";
const settings_1 = require("./settings");
const HDLPlatform_1 = require("./HDLPlatform");
module.exports = (api) => {
    api.registerPlatform(settings_1.PLATFORM_NAME, HDLPlatform_1.HDLBusproHomebridge);
};
//# sourceMappingURL=index.js.map