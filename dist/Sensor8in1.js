"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sensor8in1 = void 0;
const smart_bus_1 = __importDefault(require("smart-bus"));
class Sensor8in1 {
    constructor(platform, accessory, temp_name, brightness_name, motion_name, sound_name, ip, port, control, subnet, device) {
        this.platform = platform;
        this.accessory = accessory;
        this.temp_name = temp_name;
        this.brightness_name = brightness_name;
        this.motion_name = motion_name;
        this.sound_name = sound_name;
        this.ip = ip;
        this.port = port;
        this.control = control;
        this.subnet = subnet;
        this.device = device;
        this.SensorStates = {
            Temperature: 0,
            Brightness: 0.001,
            Motion: false,
            Sound: false,
        };
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
        this.temp_service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);
        this.temp_service.setCharacteristic(this.platform.Characteristic.Name, this.temp_name);
        this.temp_service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.handleCurrentTemperatureGet.bind(this));
        this.brightness_service = this.accessory.getService(this.platform.Service.LightSensor) || this.accessory.addService(this.platform.Service.LightSensor);
        this.brightness_service.setCharacteristic(this.platform.Characteristic.Name, this.brightness_name);
        this.brightness_service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
            .onGet(this.handleCurrentAmbientLightLevelGet.bind(this));
        this.motion_service = this.accessory.getService(this.platform.Service.MotionSensor) || this.accessory.addService(this.platform.Service.MotionSensor);
        this.motion_service.setCharacteristic(this.platform.Characteristic.Name, this.motion_name);
        this.motion_service.getCharacteristic(this.platform.Characteristic.MotionDetected)
            .onGet(this.handleMotionDetectedGet.bind(this));
        this.sound_service = this.accessory.getService(this.platform.Service.Microphone) || this.accessory.addService(this.platform.Service.Microphone);
        this.sound_service.setCharacteristic(this.platform.Characteristic.Name, this.sound_name);
        this.sound_service.getCharacteristic(this.platform.Characteristic.Mute)
            .onGet(this.handleMuteGet.bind(this));
        this.cdnstr = String(subnet).concat('.', String(control));
        this.devicestr = String(subnet).concat('.', String(device));
        this.bus = new smart_bus_1.default({
            device: this.cdnstr,
            gateway: this.ip,
            port: this.port
        });
        let that = this;
        this.bus.device(this.devicestr).on(0x1646, function (command) {
            let data = command.data;
            that.SensorStates.Temperature = data.temperature;
            that.temp_service.getCharacteristic(that.platform.Characteristic.CurrentTemperature).updateValue(data.temperature);
            that.SensorStates.Brightness = data.brightness;
            that.brightness_service.getCharacteristic(that.platform.Characteristic.CurrentAmbientLightLevel).updateValue(data.brightness);
            that.SensorStates.Motion = data.movement;
            that.motion_service.getCharacteristic(that.platform.Characteristic.MotionDetected).updateValue(data.movement);
            that.SensorStates.Sound = !data.sonic;
            that.sound_service.getCharacteristic(that.platform.Characteristic.Mute).updateValue(!data.sonic);
        });
        setInterval(() => {
            this.bus.send({
                sender: this.cdnstr,
                target: this.devicestr,
                command: 0x1645
            }, function (err) { });
        }, 1000);
    }
    async handleCurrentTemperatureGet() {
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x1645
        }, function (err) { });
        this.platform.log.debug(this.temp_name + ' updated temperature is ', this.SensorStates.Temperature);
        return this.SensorStates.Temperature;
    }
    async handleCurrentAmbientLightLevelGet() {
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x1645
        }, function (err) { });
        this.platform.log.debug(this.brightness_name + ' updated brightness is ', this.SensorStates.Brightness);
        return this.SensorStates.Brightness;
    }
    async handleMotionDetectedGet() {
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x1645
        }, function (err) { });
        this.platform.log.debug(this.motion_name + ' motion status = ', this.SensorStates.Motion);
        return this.SensorStates.Motion;
    }
    async handleMuteGet() {
        this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x1645
        }, function (err) { });
        this.platform.log.debug(this.sound_name + ' mute status = ', this.SensorStates.Sound);
        return this.SensorStates.Sound;
    }
}
exports.Sensor8in1 = Sensor8in1;
//# sourceMappingURL=Sensor8in1.js.map