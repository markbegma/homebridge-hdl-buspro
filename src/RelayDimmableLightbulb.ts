import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Device from 'smart-bus';
import { RelayListener } from './RelayLightbulb';

export class RelayDimmableLightbulb {
  private service: Service;
  private RelayDimmableLightbulbStates = {
    On: false,
    Brightness: 0,
  };

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly controller: Device,
    private readonly device: Device,
    private readonly listener: RelayListener,
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
    this.service.getCharacteristic(Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));

    const eventEmitter = this.listener.getChannelEventEmitter(this.channel);
    eventEmitter.on('update', (level) => {
      this.RelayDimmableLightbulbStates.On = (level > 0);
      this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.RelayDimmableLightbulbStates.On);
      this.RelayDimmableLightbulbStates.Brightness = level;
      this.service.getCharacteristic(Characteristic.Brightness).updateValue(this.RelayDimmableLightbulbStates.Brightness);
      if (this.RelayDimmableLightbulbStates.On) {
        this.platform.log.debug(this.name + ' is now on with brightness ' + this.RelayDimmableLightbulbStates.Brightness);
      } else {
        this.platform.log.debug(this.name + ' is now off with brightness ' + this.RelayDimmableLightbulbStates.Brightness);
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    const oldValue = this.RelayDimmableLightbulbStates.On;
    const oldBrightness = this.RelayDimmableLightbulbStates.Brightness;
    this.RelayDimmableLightbulbStates.On = value as boolean;
    if (value && oldBrightness === 0) {
      this.RelayDimmableLightbulbStates.Brightness = 100;
    }
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: (this.RelayDimmableLightbulbStates.Brightness as number) },
    }, (err) => {
      if (err) {
        // Revert to the old values
        this.RelayDimmableLightbulbStates.On = oldValue;
        this.RelayDimmableLightbulbStates.Brightness = oldBrightness;
        this.platform.log.error(`Error setting On state for ${this.device.name}: ${err.message}`);
      }
    });
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.On;
  }

  async setBrightness(value: CharacteristicValue) {
    const oldBrightness = this.RelayDimmableLightbulbStates.Brightness;
    const oldValue = this.RelayDimmableLightbulbStates.On;
    if (value === 0) {
      this.RelayDimmableLightbulbStates.On = false;
    } else {
      this.RelayDimmableLightbulbStates.On = true;
    }
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: ((value as number) * 100) },
    }, (err) => {
      if (err) {
        // Revert to the old value
        this.RelayDimmableLightbulbStates.On = oldValue;
        this.RelayDimmableLightbulbStates.Brightness = oldBrightness;
        this.platform.log.error(`Error setting Brightness state for ${this.device.name}: ${err.message}`);
      }
    });
    this.RelayDimmableLightbulbStates.Brightness = value as number;
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.Brightness;
  }
}