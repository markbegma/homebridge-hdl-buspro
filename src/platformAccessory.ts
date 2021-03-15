import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './platform';
import Bus from 'smart-bus-mrgadget';

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
    this.bus.send(this.bus.device(this.devicestr), 0x0031, { channel: this.channel, level: (+this.RelayLightbulbStates.On * 100)}, function(err) {});
  }

  async getOn(): Promise<CharacteristicValue> {
    this.bus.device(this.devicestr).channel(this.channel).on('status', function() {});
    const isOn = (this.bus.device(this.devicestr).channel(this.channel).level > 0);
    this.platform.log.debug('Get Characteristic On ->', isOn);

    return isOn;
  }
}

export class RelayDimmableLightbulb {
  private service: Service;
  private RelayDimmingLightbulbStates = {
    On: false,
    Brightness: 100,
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

  async setOn(value: CharacteristicValue) {
    this.RelayDimmingLightbulbStates.On = value as boolean;
    this.bus.send(this.bus.device(this.devicestr), 0x0031, { channel: this.channel, level: (+this.RelayDimmingLightbulbStates.On * 100)}, function(err) {});
  }

  async getOn(): Promise<CharacteristicValue> {
    this.bus.device(this.devicestr).channel(this.channel).on('status', function() {});
    const isOn = (this.bus.device(this.devicestr).channel(this.channel).level > 0);
    this.platform.log.debug('Get Characteristic On ->', isOn);

    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.RelayDimmingLightbulbStates.Brightness = value as number;
    this.bus.send(this.bus.device(this.devicestr), 0x0031, { channel: this.channel, level: this.RelayDimmingLightbulbStates.Brightness}, function(err) {});
    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

  async getBrightness(): Promise<CharacteristicValue> {
    let Brightness = 0;
    this.bus.device(this.devicestr).channel(this.channel).on('status', function() {});
    Brightness = this.bus.device(this.devicestr).channel(this.channel).level as number;
    this.platform.log.debug('Get Characteristic On ->', Brightness);

    return Brightness;
  }
}
