import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import Device from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';
import { DryListener } from './ContactSensor';
import { ABCDevice } from './ABC';

export class LeakSensor extends ABCDevice {
  private service: Service;
  private LeakStates = {
    Detected: this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED,
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
    super();
    const Service = this.platform.Service;
    const Characteristic = this.platform.Characteristic;
    this.accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'HDL');
    this.service =
    this.accessory.getService(Service.LeakSensor) || this.accessory.addService(Service.LeakSensor);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.LeakDetected)
      .onGet(this.getOn.bind(this));
    if (area !== -1) {
      const eventEmitter = this.listener.getChannelEventEmitter(this.area, this.channel);
      eventEmitter.on('update', (contact) => {
        if (this.nc) {
          if (contact) {
            this.LeakStates.Detected = Characteristic.LeakDetected.LEAK_DETECTED;
          } else {
            this.LeakStates.Detected = Characteristic.LeakDetected.LEAK_NOT_DETECTED;
          }
        } else {
          if (contact) {
            this.LeakStates.Detected = Characteristic.LeakDetected.LEAK_NOT_DETECTED;
          } else {
            this.LeakStates.Detected = Characteristic.LeakDetected.LEAK_DETECTED;
          }
        }
        this.service.getCharacteristic(Characteristic.ContactSensorState).updateValue(this.LeakStates.Detected);
        if (this.LeakStates.Detected ===
            Characteristic.LeakDetected.LEAK_DETECTED) {
          this.platform.log.debug(this.name + ' has detected leak');
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
    return this.LeakStates.Detected;
  }
}