import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { Device } from 'smart-bus';
import { HDLBusproHomebridge } from './HDLPlatform';
import { ABCDevice } from './ABC';
import { RelayListener } from './RelayLightbulb';

export class RelayFan implements ABCDevice {
  private service: Service;
  private RelayFanStates = {
    On: false,
    Speed: 0,
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
    this.service = this.accessory.getService(Service.Fan) || this.accessory.addService(Service.Fan);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
    this.service.getCharacteristic(Characteristic.RotationSpeed)
      .onSet(this.setSpeed.bind(this))
      .onGet(this.getSpeed.bind(this));

    const eventEmitter = this.listener.getChannelEventEmitter(this.channel);
    eventEmitter.on('update', (level) => {
      this.RelayFanStates.On = (level > 0);
      this.RelayFanStates.Speed = this.mapHDLSpeedToHomebridge(level);
      this.service.getCharacteristic(Characteristic.On).updateValue(this.RelayFanStates.On);
      this.service.getCharacteristic(Characteristic.RotationSpeed).updateValue(this.RelayFanStates.Speed);
      if (this.RelayFanStates.On) {
        this.platform.log.debug(this.name + ' is now on with speed ' + this.RelayFanStates.Speed);
      } else {
        this.platform.log.debug(this.name + ' is now off');
      }
    });
  }

  async setOn(value: CharacteristicValue) {
    const oldValue = this.RelayFanStates.On;
    this.RelayFanStates.On = value as boolean;
    this.controller.send({
      target: this.device,
      command: 0x0031,
      data: { channel: this.channel, level: this.RelayFanStates.On ? this.mapHomebridgeSpeedToHDL(this.RelayFanStates.Speed) : 0 },
    }, (err) => {
      if (err) {
        this.RelayFanStates.On = oldValue;
        this.platform.log.error(`Error setting On state for ${this.name}: ${err.message}`);
      } else {
        this.platform.log.debug('Successfully sent command to ' + this.name);
      }
    });
  }

  async setSpeed(value: CharacteristicValue) {
    const oldSpeed = this.RelayFanStates.Speed;
    this.RelayFanStates.Speed = value as number;
    if (this.RelayFanStates.On) {
      this.controller.send({
        target: this.device,
        command: 0x0031,
        data: { channel: this.channel, level: this.mapHomebridgeSpeedToHDL(this.RelayFanStates.Speed) },
      }, (err) => {
        if (err) {
          this.RelayFanStates.Speed = oldSpeed;
          this.platform.log.error(`Error setting speed for ${this.name}: ${err.message}`);
        } else {
          this.platform.log.debug('Successfully sent speed command to ' + this.name);
        }
      });
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.RelayFanStates.On;
  }

  async getSpeed(): Promise<CharacteristicValue> {
    return this.RelayFanStates.Speed;
  }

  // Function to map Homebridge values (0-100) to HDL values (0-10)
  private mapHomebridgeSpeedToHDL(value: number): number {
    return Math.round(value / 10);
  }

  // Function to map HDL values (0-10) to Homebridge values (0-100)
  private mapHDLSpeedToHomebridge(value: number): number {
    return Math.round(value * 10);
  }
}