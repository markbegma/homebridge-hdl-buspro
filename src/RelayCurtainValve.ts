import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import Device from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';
import { RelayCurtainListener } from './RelayCurtains';
import { ABCDevice } from './ABC';

export class RelayCurtainValve extends ABCDevice {
  private service: Service;
  private RelayCurtainValveStates = {
    ValveType: 0,
    InUse: 0,
    Active: 0,
  };

  private HDLOpening = 1;
  private HDLClosing = 2;
  private HDLStop = 0;
  private wasactive: number;


  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly controller: Device,
    private readonly device: Device,
    private readonly listener: RelayCurtainListener,
    private readonly channel: number,
    private readonly nc: boolean,
    private readonly valvetype: number,
  ) {
    super();
    const Service = this.platform.Service;
    const Characteristic = this.platform.Characteristic;
    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'HDL');
    this.service = this.accessory.getService(Service.Valve) || this.accessory.addService(Service.Valve);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.InUse)
      .onGet(this.handleInUseGet.bind(this));
    this.service.getCharacteristic(Characteristic.ValveType)
      .onGet(this.handleValveTypeGet.bind(this));
    this.service.getCharacteristic(Characteristic.Active)
      .onGet(this.handleActiveGet.bind(this))
      .onSet(this.handleActiveSet.bind(this));

    this.RelayCurtainValveStates.ValveType = this.valvetype;
    this.wasactive = this.HDLStop;
    if (this.nc===false) {
      this.HDLOpening = 2;
      this.HDLClosing = 1;
      this.HDLStop = 0;
    }
    const eventEmitter = this.listener.getCurtainEventEmitter(this.channel);
    eventEmitter.on('update', (status) => {
      switch (status) {
        case this.HDLStop:
          if (this.wasactive === this.HDLOpening) {
            this.RelayCurtainValveStates.Active = 1;
            this.RelayCurtainValveStates.InUse = 1;
            this.platform.log.debug(this.name + ' is now active');
          } else if (this.wasactive === this.HDLClosing) {
            this.RelayCurtainValveStates.Active = 0;
            this.RelayCurtainValveStates.InUse = 0;
            this.platform.log.debug(this.name + ' is now inactive');
          }
          this.service.getCharacteristic(Characteristic.Active).updateValue(this.RelayCurtainValveStates.Active);
          this.service.getCharacteristic(Characteristic.InUse).updateValue(this.RelayCurtainValveStates.InUse);
          this.wasactive = this.HDLStop;
          break;
        case this.HDLOpening:
          this.wasactive = this.HDLOpening;
          break;
        case this.HDLClosing:
          this.wasactive = this.HDLClosing;
          break;
      }
    });
    // status request
    this.controller.send({
      target: this.device,
      command: 0xE3E2,
      data: { curtain: this.channel },
    }, false);
  }

  async handleActiveSet(newactive: CharacteristicValue) {
    const oldValue = this.RelayCurtainValveStates.Active;
    if (newactive !== this.RelayCurtainValveStates.Active) {
      this.RelayCurtainValveStates.Active = newactive as number;
      let command;
      switch (newactive) {
        case 0:
          command = this.HDLClosing;
          this.platform.log.debug('Commanded a full close for ' + this.name);
          break;
        case 1:
          command = this.HDLOpening;
          this.platform.log.debug('Commanded a full open for ' + this.name);
          break;
        default:
          break;
      }
      this.controller.send({
        target: this.device,
        command: 0xE3E0,
        data: { curtain: this.channel, status: command },
      }, (err) => {
        if (err) {
          // Revert to the old value
          this.RelayCurtainValveStates.Active = oldValue;
          this.platform.log.error(`Error setting Active state for ${this.device.name}: ${err.message}`);
        }
      });
    }
  }

  async handleActiveGet(): Promise<CharacteristicValue> {
    return this.RelayCurtainValveStates.Active;
  }

  async handleInUseGet(): Promise<CharacteristicValue> {
    return this.RelayCurtainValveStates.InUse;
  }

  async handleValveTypeGet(): Promise<CharacteristicValue> {
    return this.RelayCurtainValveStates.ValveType;
  }
}