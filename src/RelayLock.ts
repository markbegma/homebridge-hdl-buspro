/* eslint-disable max-len */
/* eslint-disable curly */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

const HMBOpen = 0;
const HMBClosed = 1;

export class RelayLock {
  private service: Service;
  private RelayLockStates = {
    Lock: HMBClosed,
    Target: HMBClosed,
  };

  private bus: Bus;
  private cdnstr: string;
  private devicestr: string;
  private HDLOpen = 1;
  private HDLClosed = 0;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly lockname: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly subnet: number,
    private readonly cdn: string,
    private readonly device: string,
    private readonly channel: number,
    private readonly nc: boolean,
    private readonly lock_timeout: number,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
    this.service =
    this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);
    this.service.setCharacteristic(this.platform.Characteristic.Name, lockname);
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onSet(this.handleLockTargetStateSet.bind(this))
      .onGet(this.handleLockTargetStateGet.bind(this));
    this.cdnstr = String(subnet).concat('.', String(cdn));
    this.devicestr = String(subnet).concat('.', String(device));
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port,
    });

    if (this.nc===false) {
      this.HDLOpen = 0;
      this.HDLClosed = 1;
    }

    this.bus.device(this.devicestr).on(0x0032, (command) => {
      const data = command.data;
      const channel = data.channel;
      const level = data.level;
      if (channel === this.channel) {
        if (this.nc) this.RelayLockStates.Lock = (level === 0 ? HMBClosed : HMBOpen);
        else this.RelayLockStates.Lock = (level === 0 ? HMBOpen : HMBClosed);
        this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.RelayLockStates.Lock);
        if (this.RelayLockStates.Lock === HMBClosed) this.platform.log.debug(this.lockname + ' is now closed');
        else this.platform.log.debug(this.lockname + ' is now open');
      }
    });
  }

  async handleLockTargetStateSet(value: CharacteristicValue) {
    value = value as number;
    if (this.nc) {
      if (value === 0) value = 1;
      else value = 0;
    }
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level:  value * 100 },
    }, false);
    this.RelayLockStates.Target = value;
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.RelayLockStates.Target);
    if ((value === 1) && (this.lock_timeout > 0)) {
      setTimeout(() => {
        this.RelayLockStates.Target = 1;
        this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(1);
        this.bus.send({
          sender: this.cdnstr,
          target: this.devicestr,
          command: 0x0031,
          data: { channel: this.channel, level:  0 },
        }, false);
      }, 1000 * this.lock_timeout);
    }
  }

  async handleLockCurrentStateGet(): Promise<CharacteristicValue> {
    return this.RelayLockStates.Lock;
  }

  async handleLockTargetStateGet(): Promise<CharacteristicValue> {
    return this.RelayLockStates.Target;
  }
}