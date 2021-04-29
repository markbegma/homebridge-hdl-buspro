/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

const HMBOpening = 1;
const HMBClosing = 0;
const HMBStop = 2;

export class RelayCurtainValve {
  private service: Service;
  private RelayCurtainValveStates = {
    ValveType: HMBStop,
    InUse: 0,
    Active: 0,
  };

  private bus: Bus;
  private cdnstr: string;
  private devicestr: string;
  private postracker_process;
  private stopper_process;
  private HDLOpening = 1;
  private HDLClosing = 2;
  private HDLStop = 0;
  private wasactive: number;


  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly subnet: number,
    private readonly cdn: number,
    private readonly device: number,
    private readonly channel: number,
    private readonly nc: boolean,
    private readonly duration: number,
    private readonly valvetype: number,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
    this.service = this.accessory.getService(this.platform.Service.Valve) || this.accessory.addService(this.platform.Service.Valve);
    this.service.setCharacteristic(this.platform.Characteristic.Name, name);
    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onGet(this.handleInUseGet.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.ValveType)
      .onGet(this.handleValveTypeGet.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onGet(this.handleActiveGet.bind(this))
      .onSet(this.handleActiveSet.bind(this));
    this.cdnstr = String(subnet).concat('.', String(cdn));
    this.devicestr = String(subnet).concat('.', String(device));
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port,
    });

    this.RelayCurtainValveStates.ValveType = this.valvetype;
    this.wasactive = this.HDLStop;
    if (this.nc===false) {
      this.HDLOpening = 2;
      this.HDLClosing = 1;
      this.HDLStop = 0;
    }
    this.bus.device(this.devicestr).on(0xE3E4, (command) => {
      clearInterval(this.postracker_process);
      const curtain = command.data.curtains[this.channel-1];
      const status = curtain.status;
      /*
      if (Math.abs(this.RelayCurtainsStates.CurrentPosition - this.RelayCurtainsStates.TargetPosition) <=2) {
        this.RelayCurtainsStates.CurrentPosition = this.RelayCurtainsStates.TargetPosition;
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.RelayCurtainsStates.CurrentPosition);
      }
      */
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
          } else {
            this.service.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.RelayCurtainValveStates.Active);
            this.service.getCharacteristic(this.platform.Characteristic.InUse).updateValue(this.RelayCurtainValveStates.InUse);
          }
          this.wasactive = this.HDLStop;
          break;
        case this.HDLOpening:
          this.wasactive = this.HDLOpening;
          /*
          this.RelayCurtainsStates.PositionState = HMBOpening;
          this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.RelayCurtainsStates.PositionState);
          this.postracker_process = setInterval(() => {
            if (this.RelayCurtainsStates.CurrentPosition < 100) {
              ++this.RelayCurtainsStates.CurrentPosition;
              this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.RelayCurtainsStates.CurrentPosition);
            }
          }, 10 * this.duration);
          if ((this.RelayCurtainsStates.TargetPosition < this.RelayCurtainsStates.CurrentPosition) || (this.RelayCurtainsStates.TargetPosition === 100)) {
            this.platform.log.debug('Starting full open of ' + this.name + ' (from ' + this.RelayCurtainsStates.CurrentPosition +' to ' + this.RelayCurtainsStates.TargetPosition + ')');
            this.RelayCurtainsStates.TargetPosition = 100;
            this.service.getCharacteristic(this.platform.Characteristic.TargetPosition).updateValue(this.RelayCurtainsStates.TargetPosition);
          } else {
            this.platform.log.debug('Starting partial open of ' + this.name + ' (from ' + this.RelayCurtainsStates.CurrentPosition +' to ' + this.RelayCurtainsStates.TargetPosition + ')');
            const pathtogo = this.RelayCurtainsStates.TargetPosition-this.RelayCurtainsStates.CurrentPosition;
            clearInterval(this.stopper_process);
            this.stopper_process = setTimeout(() => {
              this.bus.send({
                sender: this.cdnstr,
                target: this.devicestr,
                command: 0xE3E0,
                data: { curtain: this.channel, status: this.HDLStop },
              }, false);
              this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.RelayCurtainsStates.CurrentPosition);
              this.platform.log.debug('Reached partial open position of ' + this.name + ' at ' + this.RelayCurtainsStates.TargetPosition);
            }, 1000 * (pathtogo/100) * this.duration);
          }
          */
          break;
        case this.HDLClosing:
          this.wasactive = this.HDLClosing;
          /*
          this.RelayCurtainsStates.PositionState = HMBClosing;
          this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.RelayCurtainsStates.PositionState);
          this.postracker_process = setInterval(() => {
            if (this.RelayCurtainsStates.CurrentPosition > 0) {
              --this.RelayCurtainsStates.CurrentPosition;
              this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.RelayCurtainsStates.CurrentPosition);
            }
          }, 10 * this.duration);
          if ((this.RelayCurtainsStates.TargetPosition > this.RelayCurtainsStates.CurrentPosition) || (this.RelayCurtainsStates.TargetPosition === 0)) {
            this.platform.log.debug('Starting full close of ' + this.name + ' (from ' + this.RelayCurtainsStates.CurrentPosition +' to ' + this.RelayCurtainsStates.TargetPosition + ')');
            this.RelayCurtainsStates.TargetPosition = 0;
            this.service.getCharacteristic(this.platform.Characteristic.TargetPosition).updateValue(this.RelayCurtainsStates.TargetPosition);
          } else {
            this.platform.log.debug('Starting partial close of ' + this.name + ' (from ' + this.RelayCurtainsStates.CurrentPosition +' to ' + this.RelayCurtainsStates.TargetPosition + ')');
            const pathtogo = this.RelayCurtainsStates.CurrentPosition-this.RelayCurtainsStates.TargetPosition;
            clearInterval(this.stopper_process);
            this.stopper_process = setTimeout(() => {
              this.bus.send({
                sender: this.cdnstr,
                target: this.devicestr,
                command: 0xE3E0,
                data: { curtain: this.channel, status: this.HDLStop },
              }, false);
              this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.RelayCurtainsStates.CurrentPosition);
              this.platform.log.debug('Reached partial close position of ' + this.name + ' at ' + this.RelayCurtainsStates.TargetPosition);
            }, 1000 * (pathtogo/100) * this.duration);
          }
          */
          break;
      }
    });
  }

  async handleActiveSet(newactive: CharacteristicValue) {
    if (newactive !== this.RelayCurtainValveStates.Active) {
      switch (newactive) {
        case 0:
          this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0xE3E0,
            data: { curtain: this.channel, status: this.HDLClosing },
          }, false);
          this.platform.log.debug('Commanded a full close for ' + this.name);
          break;
        case 1:
          this.bus.send({
            sender: this.cdnstr,
            target: this.devicestr,
            command: 0xE3E0,
            data: { curtain: this.channel, status: this.HDLOpening },
          }, false);
          this.platform.log.debug('Commanded a full open for ' + this.name);
          break;
        default:
          break;
      }
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