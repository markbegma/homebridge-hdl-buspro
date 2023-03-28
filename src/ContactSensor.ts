import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EventEmitter } from 'events';
import Device from 'smart-bus';

import { HDLBusproHomebridge } from './HDLPlatform';
import { ABCDevice, ABCListener } from './ABC';

export class ContactSensor extends ABCDevice {
  private service: Service;
  private ContactStates = {
    Detected: this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED,
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
      this.accessory.getService(Service.ContactSensor) || this.accessory.addService(Service.ContactSensor);
    this.service.setCharacteristic(Characteristic.Name, name);
    this.service.getCharacteristic(Characteristic.ContactSensorState)
      .onGet(this.getOn.bind(this));
    if (area !== -1) {
      const eventEmitter = this.listener.getChannelEventEmitter(this.area, this.channel);
      eventEmitter.on('update', (contact) => {
        if (this.nc) {
          if (contact) {
            this.ContactStates.Detected = Characteristic.ContactSensorState.CONTACT_DETECTED;
          } else {
            this.ContactStates.Detected = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
          }
        } else {
          if (contact) {
            this.ContactStates.Detected = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
          } else {
            this.ContactStates.Detected = Characteristic.ContactSensorState.CONTACT_DETECTED;
          }
        }
        this.service.getCharacteristic(Characteristic.ContactSensorState).updateValue(this.ContactStates.Detected);
        if (this.ContactStates.Detected ===
          Characteristic.ContactSensorState.CONTACT_DETECTED) {
          this.platform.log.debug(this.name + ' has detected contact');
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
    return this.ContactStates.Detected;
  }
}

export class DryListener implements ABCListener {
  private channelsMap = new Map<string, boolean>();
  private eventEmitter = new EventEmitter();

  constructor(
    private readonly device: Device,
    private readonly controller: Device,
  ) {
    // control response listener
    this.device.on(0x15CF, (command) => {
      const data = command.data;
      const area = data.area;
      const channel = data.switch;
      const contact = data.contact;
      const key = `${area}_${channel}`;
      this.channelsMap.set(key, contact);
      this.eventEmitter.emit(`update_${key}`, contact);
    });
  }

  // This function returns an EventEmitter for the specified area and channel
  getChannelEventEmitter(area: number, channel: number) {
    const key = `${area}_${channel}`;
    const eventEmitter = new EventEmitter();
    this.eventEmitter.on(`update_${key}`, (contact) => {
      eventEmitter.emit('update', contact);
    });
    return eventEmitter;
  }
}
