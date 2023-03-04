import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';

import Device from 'smart-bus';

export class RelayLightbulb {
  private service: Service;
  private RelayLightbulbStates = {
    On: false,
  };

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly controller: Device,
    private readonly device: Device,
    private readonly channel: number,
  ) {
    const Service = this.platform.Service;
    const Characteristic = this.platform.Characteristic;
    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'HDL');
    this.service = this.accessory.getService(Service.Lightbulb) || this.accessory.addService(Service.Lightbulb);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.device.on(0x0032, (command) => {
      const data = command.data;
      const channel = data.channel;
      const level = data.level;
      if (channel === this.channel) {
        this.RelayLightbulbStates.On = (level > 0);
        this.service.getCharacteristic(Characteristic.On).updateValue(this.RelayLightbulbStates.On);
        if (this.RelayLightbulbStates.On) {
          this.platform.log.debug(this.name + ' is now on');
        } else {
          this.platform.log.debug(this.name + ' is now off');
        }
      }
    });
    
    this.controller.send({
      target: this.device,
      command: 0x0033,
      data: {},
    }, false);
  }

  async setOn(value: CharacteristicValue) {
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: ((value as number) * 100) },
    }, false);
    this.RelayLightbulbStates.On = value as boolean;
  }


  async getOn(): Promise<CharacteristicValue> {
    return this.RelayLightbulbStates.On;
  }
}