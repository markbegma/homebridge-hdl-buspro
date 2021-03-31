"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayDimmableLightbulb = void 0;
const smart_bus_1 = __importDefault(require("smart-bus"));
class RelayDimmableLightbulb {
    constructor(platform, accessory, lightname, ip, port, control, subnet, device, channel) {
        this.platform = platform;
        this.accessory = accessory;
        this.lightname = lightname;
        this.ip = ip;
        this.port = port;
        this.control = control;
        this.subnet = subnet;
        this.device = device;
        this.channel = channel;
        this.RelayDimmableLightbulbStates = {
            On: false,
            Brightness: 0,
        };
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
        this.service.setCharacteristic(this.platform.Characteristic.Name, lightname);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onSet(this.setBrightness.bind(this))
            .onGet(this.getBrightness.bind(this));
        this.cdnstr = String(subnet).concat('.', String(control));
        this.devicestr = String(subnet).concat('.', String(device));
        this.bus = new smart_bus_1.default({
            device: this.cdnstr,
            gateway: this.ip,
            port: this.port
        });
        let that = this;
        this.bus.device(this.devicestr).on(0x0032, function (command) {
            let data = command.data;
            let level = data.level;
            if (channel == that.channel) {
                that.RelayDimmableLightbulbStates.On = (level > 0);
                that.RelayDimmableLightbulbStates.Brightness = level;
                if (that.RelayDimmableLightbulbStates.On) {
                    that.platform.log.debug(that.lightname + ' is now on with brightness ' + that.RelayDimmableLightbulbStates.Brightness);
                }
                else {
                    that.platform.log.debug(that.lightname + ' is now off with brightness ' + that.RelayDimmableLightbulbStates.Brightness);
                }
            }
        });
    }
    async setOn(value) {
        this.RelayDimmableLightbulbStates.On = value;
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x0031,
            data: { channel: this.channel, level: (+this.RelayDimmableLightbulbStates.On * 100) }
        }, function (err) { });
    }
    async getOn() {
        return this.RelayDimmableLightbulbStates.On;
    }
    async setBrightness(value) {
        this.RelayDimmableLightbulbStates.Brightness = value;
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x0031,
            data: { channel: this.channel, level: this.RelayDimmableLightbulbStates.Brightness }
        }, function (err) { });
    }
    async getBrightness() {
        return this.RelayDimmableLightbulbStates.Brightness;
    }
}
exports.RelayDimmableLightbulb = RelayDimmableLightbulb;
//# sourceMappingURL=RelayDimmableLightbulb.js.map