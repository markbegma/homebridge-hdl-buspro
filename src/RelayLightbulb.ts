import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

export class RelayLightbulb {
  private service: Service;
  private RelayLightbulbStates = {
    On: false,
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
    private readonly cdn: number,
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
      const channel = data.channel;
      const level = data.level;
      if (channel === that.channel) {
        that.RelayLightbulbStates.On = (level > 0);
        that.service.getCharacteristic(that.platform.Characteristic.On).updateValue(that.RelayLightbulbStates.On);
        if (that.RelayLightbulbStates.On) {
          that.platform.log.debug(that.lightname + ' is now on');
        } else {
          that.platform.log.debug(that.lightname + ' is now off');
        }
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    this.RelayLightbulbStates.On = value as boolean;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: (+this.RelayLightbulbStates.On * 100) },
    }, false);
  }


  async getOn(): Promise<CharacteristicValue> {
    return this.RelayLightbulbStates.On;
  }
}