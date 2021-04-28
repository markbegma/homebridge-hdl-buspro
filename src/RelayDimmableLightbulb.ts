import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

export class RelayDimmableLightbulb {
  private service: Service;
  private RelayDimmableLightbulbStates = {
    On: false,
    Brightness: 0,
  };

  private bus: Bus;
  private cdnstr: string;
  private devicestr: string;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly lightname: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly subnet: number,
    private readonly cdn: string,
    private readonly device: string,
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
    this.cdnstr = String(subnet).concat('.', String(cdn));
    this.devicestr = String(subnet).concat('.', String(device));
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port,
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.bus.device(this.devicestr).on(0x0032, (command) => {
      const data = command.data;
      const level = data.level;
      const channel = data.channel;
      if (channel === that.channel) {
        that.RelayDimmableLightbulbStates.On = (level > 0);
        that.service.getCharacteristic(that.platform.Characteristic.On).updateValue(that.RelayDimmableLightbulbStates.On);
        that.RelayDimmableLightbulbStates.Brightness = level;
        that.service.getCharacteristic(that.platform.Characteristic.Brightness).updateValue(that.RelayDimmableLightbulbStates.Brightness);
        if (that.RelayDimmableLightbulbStates.On) {
          that.platform.log.debug(that.lightname + ' is now on with brightness ' + that.RelayDimmableLightbulbStates.Brightness);
        } else {
          that.platform.log.debug(that.lightname + ' is now off with brightness ' + that.RelayDimmableLightbulbStates.Brightness);
        }
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: ((value as number) * 100) },
    }, false);
    this.RelayDimmableLightbulbStates.On = value as boolean;
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.On;
  }

  async setBrightness(value: CharacteristicValue) {
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: value as number },
    }, false);
    this.RelayDimmableLightbulbStates.Brightness = (value as number);
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.Brightness;
  }
}