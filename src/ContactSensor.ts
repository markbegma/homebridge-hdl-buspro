/* eslint-disable max-len */
/* eslint-disable curly */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform';
import Bus from 'smart-bus';

export class ContactSensor {
  private service: Service;
  private ContactStates = {
    Detected: this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED,
  };

  private bus: Bus;
  private cdnstr: string;
  private devicestr: string;

  constructor(
    private readonly platform: HDLBusproHomebridge,
    private readonly accessory: PlatformAccessory,
    private readonly name: string,
    private readonly ip: string,
    private readonly port: number,
    private readonly subnet: number,
    private readonly cdn: string,
    private readonly device: string,
    private readonly area: number,
    private readonly channel: number,
    private readonly nc: boolean,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'HDL');
    this.service =
    this.accessory.getService(this.platform.Service.ContactSensor) || this.accessory.addService(this.platform.Service.ContactSensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, name);
    this.service.getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .onGet(this.getOn.bind(this));
    this.cdnstr = String(subnet).concat('.', String(cdn));
    this.devicestr = String(subnet).concat('.', String(device));
    this.bus = new Bus({
      device: this.cdnstr,
      gateway: this.ip,
      port: this.port,
    });
    if (area===-1) {
      false;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      this.bus.device(this.devicestr).on(0x15CF, (command) => {
        const data = command.data;
        const area = data.area;
        const channel = data.switch;
        const contact = data.contact;
        if ((area === that.area) && (channel === that.channel)) {
          if (this.nc) {
            if (contact) that.ContactStates.Detected = this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
            else that.ContactStates.Detected = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
          } else {
            if (contact) that.ContactStates.Detected = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
            else that.ContactStates.Detected = this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
          }
        }
        that.service.getCharacteristic(that.platform.Characteristic.ContactSensorState).updateValue(that.ContactStates.Detected);
        if (that.ContactStates.Detected === this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED) that.platform.log.debug(that.name + ' has detected contact');
      });

      setInterval(() => {
        this.bus.send({
          sender: this.cdnstr,
          target: this.devicestr,
          command: 0x15CE,
          data: {area: this.area, switch: this.channel},
        }, false);
      }, 1000);
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    return this.ContactStates.Detected;
  }
}