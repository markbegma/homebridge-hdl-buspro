import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { Device } from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';
import { RelayListener } from './RelayLightbulb';
import { ABCDevice } from './ABC';

export class RelayDimmableLightbulb extends ABCDevice {
  private service: Service;
  private RelayDimmableLightbulbStates = {
    On: false,
    Brightness: 100,
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
    super();
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
      if (this.RelayDimmableLightbulbStates.On) {
        this.RelayDimmableLightbulbStates.Brightness = level;
        this.service.getCharacteristic(Characteristic.Brightness).updateValue(this.RelayDimmableLightbulbStates.Brightness);
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
    let toSend: number;
    if (this.RelayDimmableLightbulbStates.On) {
      if (this.RelayDimmableLightbulbStates.Brightness===0) {
        this.RelayDimmableLightbulbStates.Brightness = 100;
      }
      toSend = this.RelayDimmableLightbulbStates.Brightness;
    } else {
      toSend = 0;
    }
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: toSend },
    }, (err) => {
      if (err) {
        // Revert to the old values
        this.RelayDimmableLightbulbStates.On = oldValue;
        this.RelayDimmableLightbulbStates.Brightness = oldBrightness;
        this.platform.log.error(`Error setting On state for ${this.name}: ${err.message}`);
      } else {
        this.platform.log.debug('Successfully sent command to ' + this.name);
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
    this.RelayDimmableLightbulbStates.Brightness = value as number;
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: value },
    }, (err) => {
      if (err) {
        // Revert to the old value
        this.RelayDimmableLightbulbStates.On = oldValue;
        this.RelayDimmableLightbulbStates.Brightness = oldBrightness;
        this.platform.log.error(`Error setting Brightness state for ${this.name}: ${err.message}`);
      } else {
        this.platform.log.debug('Successfully sent command to ' + this.name);
      }
    });
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return this.RelayDimmableLightbulbStates.Brightness;
  }
}