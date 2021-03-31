import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

export class Sensor8in1 {
    private temp_service: Service;
    private brightness_service: Service;
    private motion_service: Service;
    private sound_service: Service;

    private SensorStates = {
      Temperature: 0,
      Brightness: 0.001,
      Motion: false,
      Sound: false,
    };

    private cdnstr: string;
    private devicestr: string;
    private bus: Bus;

    constructor(
        private readonly platform: HDLBusproHomebridge,
        private readonly accessory: PlatformAccessory,
        private readonly device_name: string,
        private readonly ip: string,
        private readonly port: number,
        private readonly control: number,
        private readonly subnet: number,
        private readonly device: number,
    ) {
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');


        this.temp_service = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
        this.accessory.addService(this.platform.Service.TemperatureSensor);
        this.temp_service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
          .onGet(this.handleCurrentTemperatureGet.bind(this));

        this.brightness_service = this.accessory.getService(this.platform.Service.LightSensor) ||
        this.accessory.addService(this.platform.Service.LightSensor);
        this.brightness_service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
          .onGet(this.handleCurrentAmbientLightLevelGet.bind(this));

        this.motion_service = this.accessory.getService(this.platform.Service.MotionSensor) ||
        this.accessory.addService(this.platform.Service.MotionSensor);
        this.motion_service.getCharacteristic(this.platform.Characteristic.MotionDetected)
          .onGet(this.handleMotionDetectedGet.bind(this));

        this.sound_service = this.accessory.getService(this.platform.Service.Microphone) ||
        this.accessory.addService(this.platform.Service.Microphone);
        this.sound_service.getCharacteristic(this.platform.Characteristic.Mute)
          .onGet(this.handleMuteGet.bind(this));

        this.cdnstr = String(subnet).concat('.', String(control));
        this.devicestr = String(subnet).concat('.', String(device));
        this.bus = new Bus({
          device: this.cdnstr,
          gateway: this.ip,
          port: this.port,
        });

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        this.bus.device(this.devicestr).on(0x1646, (command) => {
          const data = command.data;

          that.SensorStates.Temperature = data.temperature;
          that.temp_service.getCharacteristic(that.platform.Characteristic.CurrentTemperature).updateValue(data.temperature);

          that.SensorStates.Brightness = data.brightness+0.001;
          // eslint-disable-next-line max-len
          that.brightness_service.getCharacteristic(that.platform.Characteristic.CurrentAmbientLightLevel).updateValue(data.brightness+0.001);

          that.SensorStates.Motion = data.movement;
          that.motion_service.getCharacteristic(that.platform.Characteristic.MotionDetected).updateValue(data.movement);

          that.SensorStates.Sound = !data.sonic;
          that.sound_service.getCharacteristic(that.platform.Characteristic.Mute).updateValue(!data.sonic);
        });

        setInterval(() => {
          this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0x1645,
          }, false);
        }, 1000);
    }

    async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
      this.bus.send({
        sender: this.cdnstr,
        target: this.devicestr,
        command: 0x1645,
      }, false);
      this.platform.log.debug(this.device_name + ' updated temperature is ', this.SensorStates.Temperature);
      return this.SensorStates.Temperature;
    }

    async handleCurrentAmbientLightLevelGet(): Promise<CharacteristicValue> {
      this.bus.send({
        sender: this.cdnstr,
        target: this.devicestr,
        command: 0x1645,
      }, false);
      this.platform.log.debug(this.device_name + ' updated brightness is ', this.SensorStates.Brightness);
      return this.SensorStates.Brightness;
    }

    async handleMotionDetectedGet(): Promise<CharacteristicValue> {
      this.bus.send({
        sender: this.cdnstr,
        target: this.devicestr,
        command: 0x1645,
      }, false);
      this.platform.log.debug(this.device_name + ' motion status = ', this.SensorStates.Motion);
      return this.SensorStates.Motion;
    }

    async handleMuteGet(): Promise<CharacteristicValue> {
      this.bus.send({
        sender: this.cdnstr,
        target: this.devicestr,
        command: 0x1645,
      }, false);
      this.platform.log.debug(this.device_name + ' mute status = ', this.SensorStates.Sound);
      return this.SensorStates.Sound;
    }

}