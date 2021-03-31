"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayLightbulb = void 0;
const smart_bus_1 = __importDefault(require("smart-bus"));
class RelayLightbulb {
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
        this.RelayLightbulbStates = {
            On: false,
        };
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
        this.service.setCharacteristic(this.platform.Characteristic.Name, lightname);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
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
            let channel = data.channel;
            let level = data.level;
            if (channel == that.channel) {
                that.RelayLightbulbStates.On = (level > 0);
                if (that.RelayLightbulbStates.On) {
                    that.platform.log.debug(that.lightname + ' is now on');
                }
                else {
                    that.platform.log.debug(that.lightname + ' is now off');
                }
            }
            ;
        });
    }
    async setOn(value) {
        this.RelayLightbulbStates.On = value;
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x0031,
            data: { channel: this.channel, level: (+this.RelayLightbulbStates.On * 100) }
        }, function (err) { });
    }
    async getOn() {
        return this.RelayLightbulbStates.On;
    }
}
exports.RelayLightbulb = RelayLightbulb;
//# sourceMappingURL=RelayLightbulb.js.map