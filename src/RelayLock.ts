/* eslint-disable max-len */
/* eslint-disable curly */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Device from 'smart-bus';
import { RelayListener } from './RelayLightbulb';


const HMBOpen = 0;
const HMBClosed = 1;

export class RelayLock {
  private service: Service;
  private RelayLockStates = {
    Lock: HMBClosed,
    Target: HMBClosed,
  };

  private HDLOpen = 1;
  private HDLClosed = 0;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly controller: Device,
    private readonly device: Device,
    private readonly listener: RelayListener,
    private readonly channel: number,
    private readonly nc: boolean,
    private readonly lock_timeout: number,
  ) {
    const Service = this.platform.Service;
    const Characteristic = this.platform.Characteristic;
    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'HDL');
    this.service =
    this.accessory.getService(Service.LockMechanism) || this.accessory.addService(Service.LockMechanism);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this));
    this.service.getCharacteristic(Characteristic.LockTargetState)
      .onSet(this.handleLockTargetStateSet.bind(this))
      .onGet(this.handleLockTargetStateGet.bind(this));

    if (this.nc===false) {
      this.HDLOpen = 0;
      this.HDLClosed = 1;
    }

    const eventEmitter = this.listener.getChannelEventEmitter(this.channel);
    eventEmitter.on('update', (level) => {
      if (channel === this.channel) {
        if (this.nc) this.RelayLockStates.Lock = (level === 0 ? HMBClosed : HMBOpen);
        else this.RelayLockStates.Lock = (level === 0 ? HMBOpen : HMBClosed);
        this.service.getCharacteristic(Characteristic.LockCurrentState).updateValue(this.RelayLockStates.Lock);
        if (this.RelayLockStates.Lock === HMBClosed) this.platform.log.debug(this.name + ' is now closed');
        else this.platform.log.debug(this.name + ' is now open');
      }
    });
  }

  async handleLockTargetStateSet(value: CharacteristicValue) {
    value = value as number;
    const oldValue = this.RelayLockStates.Target;
    this.RelayLockStates.Target = value;
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.RelayLockStates.Target);
    if (this.nc) {
      if (value === 0) value = 1;
      else value = 0;
    }
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: ((value as number) * 100) },
    }, (err) => {
      if (err) {
        // Revert to the old value
        this.RelayLockStates.Target = oldValue;
        this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.RelayLockStates.Target);
        this.platform.log.error(`Error setting LockTarget state for ${this.device.name}: ${err.message}`);
      } else {
        if ((value === 1) && (this.lock_timeout > 0)) {
          setTimeout(() => {
            this.handleLockTargetStateSet(HMBClosed)}, 1000 * this.lock_timeout);
        }
      }
    });
  }

  async handleLockCurrentStateGet(): Promise<CharacteristicValue> {
    return this.RelayLockStates.Lock;
  }

  async handleLockTargetStateGet(): Promise<CharacteristicValue> {
    return this.RelayLockStates.Target;
  }
}