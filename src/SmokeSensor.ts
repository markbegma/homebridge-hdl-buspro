import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import Device from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';
import { DryListener } from './ContactSensor';

export class SmokeSensor {
  private service: Service;
  private SmokeStates = {
    Detected: this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
  };

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly controller: Device,
    private readonly device: Device,
    private readonly listener: DryListener,
    private readonly area: number,
    private readonly channel: number,
    private readonly nc: boolean,
  ) {
    const Service = this.platform.Service;
    const Characteristic = this.platform.Characteristic;
    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'HDL');
    this.service =
      this.accessory.getService(Service.SmokeSensor) || this.accessory.addService(Service.SmokeSensor);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.SmokeDetected)
      .onGet(this.getOn.bind(this));
    if (area !== -1) {
      const eventEmitter = this.listener.getChannelEventEmitter(this.area, this.channel);
      eventEmitter.on('update', (contact) => {
        if (this.nc) {
          if (contact) {
            this.SmokeStates.Detected = Characteristic.SmokeDetected.SMOKE_DETECTED;
          } else {
            this.SmokeStates.Detected = Characteristic.SmokeDetected.SMOKE_NOT_DETECTED;
          }
        } else {
          if (contact) {
            this.SmokeStates.Detected = Characteristic.SmokeDetected.SMOKE_NOT_DETECTED;
          } else {
            this.SmokeStates.Detected = Characteristic.SmokeDetected.SMOKE_DETECTED;
          }
        }
        this.service.getCharacteristic(Characteristic.SmokeDetected).updateValue(this.SmokeStates.Detected);
        if (this.SmokeStates.Detected ===
          Characteristic.SmokeDetected.SMOKE_DETECTED) {
          this.platform.log.debug(this.name + ' has detected smoke');
        }
      });

      setInterval(() => {
        this.controller.send({
          target: this.device,
          command: 0x15CE,
          data: { area: this.area, switch: this.channel },
        }, false);
      }, 1000);
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.SmokeStates.Detected;
  }
}
