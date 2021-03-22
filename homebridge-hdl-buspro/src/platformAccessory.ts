import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './platform';
import Bus from 'smart-bus';

export class RelayLightbulb {
  private service: Service;
  private RelayLightbulbStates = {
    On: false,
  };
  private cdnstr: string;
  private devicestr: string;
  private bus: Bus;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly lightname: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly control: number,
    private readonly subnet: number,
    private readonly device: number,
    private readonly channel: number,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, lightname);
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
    this.cdnstr = String(subnet).concat('.', String(control));
    this.devicestr = String(subnet).concat('.', String(device));
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port
    });
  }

  async setOn(value: CharacteristicValue) {
    this.RelayLightbulbStates.On = value as boolean;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: (+this.RelayLightbulbStates.On * 100) }
    }, function(err) {});
  }

  async OnListener()  {
    let on = await new this.bus.device(this.devicestr).on(0x0032, function(command) {
      let data = command.data;
      let success = data.success;
      let channel = data.channel;
      let level = data.level;

      if (level) {
        return level;
      } else {
        return false;
      };
    });
    this.RelayLightbulbStates.On = (on > 0);
  }


  async getOn(): Promise<CharacteristicValue> {
    let isOn = this.RelayLightbulbStates.On;
    this.platform.log.debug('Get Characteristic On ->', isOn);
    return isOn;
  }
}

export class RelayDimmableLightbulb {
  private service: Service;
  private RelayDimmableLightbulbStates = {
    On: false,
    Brightness: 0,
  };
  private cdnstr: string;
  private devicestr: string;
  private bus: Bus;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly lightname: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly control: number,
    private readonly subnet: number,
    private readonly device: number,
    private readonly channel: number,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
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
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port
    });
  }

  async OnListener()  {
    let on = await new this.bus.device(this.devicestr).on(0x0032, function(command) {
      let data = command.data;
      let success = data.success;
      let channel = data.channel;
      let level = data.level;

      if (level) {
        return level;
      } else {
        return false;
      };
    });
    this.RelayDimmableLightbulbStates.On = (on > 0);
    this.RelayDimmableLightbulbStates.Brightness = on;
  }

  async setOn(value: CharacteristicValue) {
    this.RelayDimmableLightbulbStates.On = value as boolean;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: (+this.RelayDimmableLightbulbStates.On * 100) }
    }, function(err) {});
  }

  async getOn(): Promise<CharacteristicValue> {
    let isOn = this.RelayDimmableLightbulbStates.On;
    this.platform.log.debug('Get Characteristic On ->', isOn);
    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    this.RelayDimmableLightbulbStates.Brightness = value as number;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: this.RelayDimmableLightbulbStates.Brightness }
    }, function(err) {});
  }

  async getBrightness(): Promise<CharacteristicValue> {
    let Brightness = this.RelayDimmableLightbulbStates.Brightness;
    this.platform.log.debug('Get Characteristic Brightness ->', Brightness);
    return Brightness;
  }
}

export class Sensor8in1 {
  private temp_service: Service;
  /*
  private brig_service: Service;
  private mot_service: Service;
  private snd_service: Service;
  */
  private SensorStates = {
    Temperature: 0,
    Brightness: 0,
    Sound: false,
    Motion: false,
  };
  private cdnstr: string;
  private devicestr: string;
  private bus: Bus;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly temp_name: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly control: number,
    private readonly subnet: number,
    private readonly device: number,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');


    this.temp_service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.temp_service.setCharacteristic(this.platform.Characteristic.Name, temp_name);
    this.temp_service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));
    this.cdnstr = String(subnet).concat('.', String(control));
    this.devicestr = String(subnet).concat('.', String(device));
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port
    });

    setInterval(() => {
      this.platform.log.debug('asking for update');
      this.bus.send({
        sender: this.cdnstr,
        target: this.devicestr,
        command: 0x1645
      }, function(err) {});
    }, 10000);
  }

  async sensorUpdater()  {
    this.platform.log.debug('updating');
    let sensordata = await this.bus.device(this.devicestr).on(0x1646, function(command) {
      let data = command.data;
      let temperature = data.temperature;
      //this.SensorStates.Temperature = temperature;
      if (data) {
        return data;
      } else {
        return false;
      };
    });
    this.SensorStates.Temperature = sensordata.temperature;
    this.temp_service.getCharacteristic(this.platform.Characteristic.CurrentTemperature).updateValue(this.SensorStates.Temperature);
  }

  async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x1645
    }, function(err) {});
    let temp = this.SensorStates.Temperature;
    this.platform.log.debug('Get Characteristic Temperature ->', temp);
    return temp;
  }

}