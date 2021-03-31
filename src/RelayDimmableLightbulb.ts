import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from 'homebridge-hdl-buspro/src/HDLPlatform';
import Bus from 'smart-bus';

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

    let that = this;
    this.bus.device(this.devicestr).on(0x0032, function (command) {
      let data = command.data;
      let level = data.level;
      if (channel == that.channel) {
        that.RelayDimmableLightbulbStates.On = (level > 0);
        that.RelayDimmableLightbulbStates.Brightness = level;
        if (that.RelayDimmableLightbulbStates.On) {
          that.platform.log.debug(that.lightname + ' is now on with brightness ' + that.RelayDimmableLightbulbStates.Brightness);
        } else {
          that.platform.log.debug(that.lightname + ' is now off with brightness ' + that.RelayDimmableLightbulbStates.Brightness);
        }
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    this.RelayDimmableLightbulbStates.On = value as boolean;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: (+this.RelayDimmableLightbulbStates.On * 100) }
    }, function (err) { });
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.On;
  }

  async setBrightness(value: CharacteristicValue) {
    this.RelayDimmableLightbulbStates.Brightness = value as number;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: this.RelayDimmableLightbulbStates.Brightness }
    }, function (err) { });
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.Brightness;
  }
}