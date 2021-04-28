/* eslint-disable max-len */
/* eslint-disable no-var */
/* eslint-disable no-case-declarations */
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { RelayLightbulb } from './RelayLightbulb';
import { RelayDimmableLightbulb } from './RelayDimmableLightbulb';
import { Sensor8in1 } from './Sensor8in1';
import { RelayLock } from './RelayLock';
import { LeakSensor } from './LeakSensor';
import { ContactSensor } from './ContactSensor';
import { RelayCurtains } from './RelayCurtains';
import { RelayCurtainValve } from './RelayCurtainValve';

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
      const ip = bus.bus_IP;
      const port = bus.bus_port;
      for (const subnet of bus.subnets) {
        const subnet_number = subnet.subnet_number;
        const cd_number = subnet.cd_number;
        for (const device of subnet.devices) {
          const device_name = device.device_name;
          const device_number = device.device_address;
          const device_type = device.device_type;
          switch (device_type) {
            case 'relaylightbulb':
              var channel_number = device.channel;
              var UniqueID =
              String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new RelayLightbulb(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number);
              } else {
                this.log.info('Adding new accessory:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new RelayLightbulb(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            case 'relaydimmablelightbulb':
              var channel_number = device.channel;
              var UniqueID =
              String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new RelayDimmableLightbulb(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number);
              } else {
                this.log.info('Adding new accessory:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new RelayDimmableLightbulb(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            case 'sensor8in1':
              var UniqueID = String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new Sensor8in1(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number);
              } else {
                this.log.info('Adding new accessoriy:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new Sensor8in1(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            case 'relaylock':
              var channel_number = device.channel;
              var nc = device.nc;
              var lock_timeout = device.lock_timeout;
              var UniqueID =
              String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new RelayLock(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number, nc, lock_timeout);
              } else {
                this.log.info('Adding new accessory:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new RelayLock(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number, nc, lock_timeout);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            case 'relaycurtains':
              var channel_number = device.channel;
              var duration = device.duration;
              var nc = device.nc;
              var curtains_precision = device.curtains_precision;
              var UniqueID =
                String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new RelayCurtains(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number, nc, duration, curtains_precision);
              } else {
                this.log.info('Adding new accessory:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new RelayCurtains(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number, nc, duration, curtains_precision);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            case 'relaycurtainvalve':
              var channel_number = device.channel;
              var duration = device.duration;
              var nc = device.nc;
              var valvetype = device.valvetype;
              var UniqueID =
                  String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(channel_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new RelayCurtainValve(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number, nc, duration, valvetype);
              } else {
                this.log.info('Adding new accessory:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new RelayCurtainValve(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number, channel_number, nc, duration, valvetype);
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
              break;
            case 'drycontact':
              var area_number = device.area;
              var channel_number = device.channel;
              var nc = device.nc;
              var drycontact_type = device.drycontact_type;
              var UniqueID =
              String(ip).concat(':', String(port), '.', String(subnet_number), '.', String(device_number), '.', String(area_number), '.', String(channel_number));
              var uuid = this.api.hap.uuid.generate(UniqueID);
              var existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
              var NeededClass;
              switch (drycontact_type) {
                case 'leaksensor':
                  NeededClass = LeakSensor;
                  break;
                case 'contactsensor':
                  NeededClass = ContactSensor;
                  break;
                default:
                  break;
              }
              if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                new NeededClass(this, existingAccessory, device_name, ip, port, subnet_number, cd_number, device_number, area_number, channel_number, nc);
              } else {
                this.log.info('Adding new accessory:', device_name);
                var accessory = new this.api.platformAccessory(device_name, uuid);
                new NeededClass(this, accessory, device_name, ip, port, subnet_number, cd_number, device_number, area_number, channel_number, nc);
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
