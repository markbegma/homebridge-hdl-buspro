import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';

import Device from 'smart-bus';

import { EventEmitter } from 'events';

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

    const eventEmitter = this.listener.getChannelEventEmitter(this.channel);
    eventEmitter.on('update', (level) => {
      this.RelayLightbulbStates.On = (level > 0);
      this.service.getCharacteristic(Characteristic.On).updateValue(this.RelayLightbulbStates.On);
      if (this.RelayLightbulbStates.On) {
        this.platform.log.debug(this.name + ' is now on');
      } else {
        this.platform.log.debug(this.name + ' is now off');
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    const oldValue = this.RelayLightbulbStates.On;
    this.RelayLightbulbStates.On = value as boolean;
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: ((value as number) * 100) },
    }, (err) => {
      if (err) {
        // Revert to the old value
        this.RelayLightbulbStates.On = oldValue;
        this.platform.log.error(`Error setting On state for ${this.device.name}: ${err.message}`);
      }
    });
  }


  async getOn(): Promise<CharacteristicValue> {
    return this.RelayLightbulbStates.On;
  }
}

export class RelayListener {
  private channelsMap = new Map();
  private eventEmitter = new EventEmitter();

  constructor(
    private readonly device: Device,
    private readonly controller: Device
  ) {
    // control response listener
    this.device.on(0x0032, (command) => {
      const data = command.data;
      const channel = data.channel;
      const level = data.level;
      this.channelsMap.set(channel, level);
      this.eventEmitter.emit(`update_${channel}`, level);
    });
    // status request response listener
    this.device.on(0x0034, (command) => {
      const data = command.data;
      for (const channelInfo of data) {
        this.channelsMap.set(channelInfo.number, channelInfo.level);
        this.eventEmitter.emit(`update_${channelInfo.number}`, channelInfo.level);
      }
    });
    // status request
    this.controller.send({
      target: this.device,
      command: 0x0033
    }, false);
  }

  // This function returns an EventEmitter for the specified channel
  getChannelEventEmitter(channel: number) {
    const eventEmitter = new EventEmitter();
    this.eventEmitter.on(`update_${channel}`, (level) => {
      eventEmitter.emit('update', level);
    });
    return eventEmitter;
  }
}
