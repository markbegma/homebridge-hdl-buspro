import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import Device from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';
import { DryListener } from './ContactSensor';

export class OccupancySensor {
  private service: Service;
  private OccupancyStates = {
    Detected: this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
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
    this.accessory.getService(Service.OccupancySensor) || this.accessory.addService(Service.OccupancySensor);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.OccupancyDetected)
      .onGet(this.getOn.bind(this));
      if (area !== -1) {
        const eventEmitter = this.listener.getChannelEventEmitter(this.area, this.channel);
        eventEmitter.on('update', (contact) => {
          if (this.nc) {
            if (contact) this.OccupancyStates.Detected = Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;
            else this.OccupancyStates.Detected = Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
          } else {
            if (contact) this.OccupancyStates.Detected = Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
            else this.OccupancyStates.Detected = Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;
          }
          this.service.getCharacteristic(Characteristic.OccupancyDetected).updateValue(this.OccupancyStates.Detected);
          if (this.OccupancyStates.Detected ===
            Characteristic.OccupancyDetected.OCCUPANCY_DETECTED) this.platform.log.debug(this.name + ' has detected occupancy');
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
    return this.OccupancyStates.Detected;
  }
}
