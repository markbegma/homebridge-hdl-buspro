import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import Device from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';

export class Sensor8in1 {
  private temp_service: Service;
  private brightness_service: Service;
  private motion_service: Service;
  private sound_service: Service;

  private SensorStates = {
    Temperature: 0,
    Brightness: 0.0001,
    Motion: false,
    Sound: false,
  };

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly controller: Device,
    private readonly device: Device,
    private readonly listener: SensorListener,
  ) {
    const Service = this.platform.Service;
    const Characteristic = this.platform.Characteristic;
    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'HDL');

    this.temp_service = this.accessory.getService(Service.TemperatureSensor) ||
      this.accessory.addService(Service.TemperatureSensor);
    this.temp_service.getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    this.brightness_service = this.accessory.getService(Service.LightSensor) ||
      this.accessory.addService(Service.LightSensor);
    this.brightness_service.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .onGet(this.handleCurrentAmbientLightLevelGet.bind(this));

    this.motion_service = this.accessory.getService(Service.MotionSensor) ||
      this.accessory.addService(Service.MotionSensor);
    this.motion_service.getCharacteristic(Characteristic.MotionDetected)
      .onGet(this.handleMotionDetectedGet.bind(this));

    this.sound_service = this.accessory.getService(Service.Microphone) ||
      this.accessory.addService(Service.Microphone);
    this.sound_service.getCharacteristic(Characteristic.Mute)
      .onGet(this.handleMuteGet.bind(this));

    this.device.on(0x1646, (command) => {
      const data = command.data;

      this.SensorStates.Temperature = data.temperature;
      this.temp_service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.SensorStates.Temperature);
      this.platform.log.debug(this.name + ' updated temperature is ', this.SensorStates.Temperature);

      this.SensorStates.Brightness = data.brightness + 0.0001;
      this.brightness_service.getCharacteristic(Characteristic.CurrentAmbientLightLevel).updateValue(this.SensorStates.Brightness);
      this.platform.log.debug(this.name + ' updated brightness is ', this.SensorStates.Brightness);

      this.SensorStates.Motion = data.movement;
      this.motion_service.getCharacteristic(Characteristic.MotionDetected).updateValue(this.SensorStates.Motion);
      this.platform.log.debug(this.name + ' motion status = ', this.SensorStates.Motion);

      this.SensorStates.Sound = !data.sonic;
      this.sound_service.getCharacteristic(Characteristic.Mute).updateValue(this.SensorStates.Sound);
      this.platform.log.debug(this.name + ' mute status = ', this.SensorStates.Sound);
    });

    setInterval(() => {
      this.controller.send({
        target: this.device,
        command: 0x1645,
      }, false);
    }, 1000);
  }

  async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
    return this.SensorStates.Temperature;
  }

  async handleCurrentAmbientLightLevelGet(): Promise<CharacteristicValue> {
    return this.SensorStates.Brightness;
  }

  async handleMotionDetectedGet(): Promise<CharacteristicValue> {
    return this.SensorStates.Motion;
  }

  async handleMuteGet(): Promise<CharacteristicValue> {
    return this.SensorStates.Sound;
  }
}

export class SensorListener {}