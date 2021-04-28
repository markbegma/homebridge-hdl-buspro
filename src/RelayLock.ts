/* eslint-disable max-len */
/* eslint-disable curly */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

export class RelayLock {
  private service: Service;
  private RelayLockStates = {
    Lock: true,
    Target: true,
  };

  private bus: Bus;
  private cdnstr: string;
  private devicestr: string;

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

    this.bus.device(this.devicestr).on(0x0032, (command) => {
      const data = command.data;
      const channel = data.channel;
      const level = data.level;
      if (channel === this.channel) {
        if (this.nc) this.RelayLockStates.Lock = (level > 0 ? false : true);
        else this.RelayLockStates.Lock = (level > 0 ? true : false);
        this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.RelayLockStates.Lock);
        if (this.RelayLockStates.Lock) {
          if (this.nc) this.platform.log.debug(this.lockname + ' is now closed');
          else this.platform.log.debug(this.lockname + ' is now open');
        } else {
          if (this.nc) this.platform.log.debug(this.lockname + ' is now open');
          else this.platform.log.debug(this.lockname + ' is now closed');
        }
      }
    });
  }

  async handleLockTargetStateSet(value: CharacteristicValue) {
    let boolvalue: boolean;
    if (this.nc) boolvalue = (value===0);
    else boolvalue = (value===1);
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: ((boolvalue as unknown as number) * 100) },
    }, false);
    this.RelayLockStates.Lock = boolvalue;
    this.RelayLockStates.Target = boolvalue;
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.RelayLockStates.Lock as unknown as number);
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.RelayLockStates.Target as unknown as number);
    if (((value as number) === 0) && (this.lock_timeout > 0)) {
      setTimeout(() => {
        this.bus.send({
          sender: this.cdnstr,
          target: this.devicestr,
          command: 0x0031,
          data: { channel: this.channel, level: ((!boolvalue as unknown as number) * 100) },
        }, false);
        setTimeout(() => {
          this.RelayLockStates.Lock = !boolvalue;
          this.RelayLockStates.Target = !boolvalue;
          this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(1);
          this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(1);
        }, 3000);
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