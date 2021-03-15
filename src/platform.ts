import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { RelayLightbulb, RelayDimmableLightbulb } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HDLBusproHomebridge implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;


  // this is used to track restored cached accessories
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

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    //import * as configjson from 'config.schema.json';

    const ConfigDevices = [
      {
        exampleUniqueId: 'abcdefg',
        exampleDisplayName: 'Мансарда верхний',
      }
    ];

    // loop over the discovered devices and register each one if it has not already been registered
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
                  //accessory.context.device = device;
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
                    //accessory.context.device = device;
                    new RelayDimmableLightbulb(this, accessory, channel_name, ip, port, cdn, subnet_number, device_number, channel_number);
                    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                  }
                };
                break;
            default:
              break;
            }
        }
      }
    }
  }
}
