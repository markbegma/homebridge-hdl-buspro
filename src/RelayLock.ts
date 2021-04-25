/* eslint-disable curly */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

export class RelayLock {
  private service: Service;
  private RelayLockStates = {
    Lock: true,
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
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
    this.service =
    this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);
    this.service.setCharacteristic(this.platform.Characteristic.Name, lockname);
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
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
        if (this.nc) that.RelayLockStates.Lock = (level > 0 ? false : true);
        else that.RelayLockStates.Lock = (level > 0 ? true : false);
        that.service.getCharacteristic(that.platform.Characteristic.LockCurrentState).updateValue(that.RelayLockStates.Lock);
        if (that.RelayLockStates.Lock) {
          if (this.nc) that.platform.log.debug(that.lockname + ' is now closed');
          else that.platform.log.debug(that.lockname + ' is now open');
        } else {
          if (this.nc) that.platform.log.debug(that.lockname + ' is now open');
          else that.platform.log.debug(that.lockname + ' is now closed');
        }
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    let boolvalue = true;
    if (this.nc) boolvalue = (value===0);
    else boolvalue = (value===1);
    this.RelayLockStates.Lock = boolvalue;
    this.bus.send({
      sender: this.cdnstr,
      target: this.devicestr,
      command: 0x0031,
      data: { channel: this.channel, level: (+this.RelayLockStates.Lock * 100) },
    }, false);
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.RelayLockStates.Lock;
  }
}