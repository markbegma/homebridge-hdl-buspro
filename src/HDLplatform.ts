import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { RelayLightbulb } from './RelayLightbulb';
import { RelayDimmableLightbulb } from './RelayDimmableLightbulb';
import { Sensor8in1 } from './Sensor8in1';

export class HDLBusproHomebridge implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    for (const bus of this.config.buses) {
      const ip = bus.ip;
      const port = bus.port;
      for (const subnet of bus.subnets) {
        const subnet_number = subnet.number;
        const cdn = subnet.cdn;
        for (const device of subnet.devices) {
          const device_number = device.number;
          const specification = device.specification;
          switch (specification) {
            case 'Relay Lightbulb':
              for (const channel of device.channels) {
                const channel_number = channel.number;
                const channel_name = channel.name;
                const UniqueID = String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
                const uuid = this.api.hap.uuid.generate(UniqueID);
                const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
                if (existingAccessory) {
                  this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                  new RelayLightbulb(this, existingAccessory, channel_name, ip, port, cdn, subnet_number, device_number, channel_number);
                } else {
                  this.log.info('Adding new accessory:', channel_name);
                  const accessory = new this.api.platformAccessory(channel_name, uuid);
                  new RelayLightbulb(this, accessory, channel_name, ip, port, cdn, subnet_number, device_number, channel_number);
                  this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                }
              };
              break;
            case 'Relay Dimmable Lightbulb':
              for (const channel of device.channels) {
                const channel_number = channel.number;
                const channel_name = channel.name;
                const UniqueID = String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
                const uuid = this.api.hap.uuid.generate(UniqueID);
                const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
                if (existingAccessory) {
                  this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                  new RelayDimmableLightbulb(this, existingAccessory, channel_name, ip, port, cdn, subnet_number, device_number, channel_number);
                } else {
                  this.log.info('Adding new accessory:', channel_name);
                  const accessory = new this.api.platformAccessory(channel_name, uuid);
                  new RelayDimmableLightbulb(this, accessory, channel_name, ip, port, cdn, subnet_number, device_number, channel_number);
                  this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                }
              };
              break;
            case 'Sensor 8 in 1':
              const device_name = device.name;
              const temp_name = device.sensor.temp_name;
              const brightness_name = device.sensor.brightness_name;
              const motion_name = device.sensor.motion_name;
              const sound_name = device.sensor.sound_name;
              const UniqueID = String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number));
              const uuid = this.api.hap.uuid.generate(UniqueID);
              const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new Sensor8in1(this, existingAccessory, temp_name, brightness_name, motion_name, sound_name, ip, port, cdn, subnet_number, device_number);
              } else {
                this.log.info('Adding new accessoriy:', device_name);
                const accessory = new this.api.platformAccessory(device_name, uuid);
                new Sensor8in1(this, accessory, temp_name, brightness_name, motion_name, sound_name, ip, port, cdn, subnet_number, device_number);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            default:
              break;
          }
        }
      }
    }
  }
}
