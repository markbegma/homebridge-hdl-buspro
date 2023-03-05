import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import Bus from 'smart-bus';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { deviceTypeMap } from './DeviceList'

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
      const busObj = new Bus({
        gateway: ip,
        port: port,
      });
      for (const subnet of bus.subnets) {
        const subnet_number = subnet.subnet_number;
        const cd_number = subnet.cd_number;
        const controllerObj = busObj.controller(`${subnet}.${cd_number}`);
        const addressedDeviceMap = new Map();
        const uniqueIDPrefix = `${ip}:${port}.${subnet_number}`;
        for (const device of subnet.devices) {
          this.discoverDevice(busObj, subnet, device, uniqueIDPrefix, controllerObj, addressedDeviceMap);
        }
      }
    }
  }

  discoverDevice(busObj, subnet, device, uniqueIDPrefix, controllerObj, addressedDeviceMap) {
    const deviceAddress = `${subnet}.${device.device_address}`;
    const deviceType = (device.device_type === 'drycontact') ? device.drycontact_type : device.device_type;
    const deviceTypeConfig = deviceTypeMap[deviceType];
    if (!deviceTypeConfig) {
      this.log.error('Invalid device type:', deviceType);
      return;
    }
    const { deviceClass, listenerClass, uniqueArgs, idEnding } = deviceTypeConfig;
    var uniqueIDSuffix = `.${device.device_address}`
    if (idEnding(device)) uniqueIDSuffix = `${uniqueIDSuffix}.${idEnding(device)}`;
    const uniqueID = `${uniqueIDPrefix}.${uniqueIDSuffix}`;
    const uuid = this.api.hap.uuid.generate(uniqueID);
    let deviceObj;
    let listenerObj;
    if (addressedDeviceMap.has(deviceAddress)) {
      ({ deviceObj, listenerObj } = addressedDeviceMap.get(deviceAddress));
    } else {
      deviceObj = busObj.device(deviceAddress);
      listenerObj = listenerClass(deviceObj, controllerObj);
      addressedDeviceMap.set(deviceAddress, { deviceObj, listenerObj });
    }
    const commonArgs = [device.device_name, controllerObj, deviceObj, listenerObj];
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
    buildDevice(this, existingAccessory, deviceClass, commonArgs, uniqueArgs(device), uuid);
  }
}

function buildDevice(platform, accessory, deviceClass, commonArgs, uniqueArgs, uuid) {
  if (accessory) {
    platform.log.info('Restoring existing accessory from cache:', accessory.displayName);
  } else {
    platform.log.info('Adding new accessory:', commonArgs[0]);
    accessory = new platform.api.platformAccessory(commonArgs[0], uuid);
    platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }
  new deviceClass(platform, accessory, ...commonArgs, ...uniqueArgs);
}
