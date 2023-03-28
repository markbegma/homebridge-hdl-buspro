import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { Bus, Device } from 'smart-bus';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { DeviceType, deviceTypeMap } from './DeviceList';
import { ABCDevice, ABCListener } from './ABC';

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
      const ip: string = bus.bus_IP;
      const port: number = bus.bus_port;
      const busObj: Bus = new Bus({
        gateway: ip,
        port: port,
      });
      for (const subnet of bus.subnets) {
        const subnet_number: number = subnet.subnet_number;
        const cd_number: number = subnet.cd_number;
        const controllerObj: Device = busObj.controller(`${subnet}.${cd_number}`);
        const addressedDeviceMap = new Map();
        const uniqueIDPrefix = `${ip}:${port}.${subnet_number}`;
        for (const device of subnet.devices) {
          this.discoverDevice(busObj, subnet, device, uniqueIDPrefix, controllerObj, addressedDeviceMap);
        }
      }
    }
  }

  discoverDevice(busObj: Bus, subnet: number, device, uniqueIDPrefix: string, controllerObj: Device, addressedDeviceMap: Map<any, any>) {
    const deviceAddress = `${subnet}.${device.device_address}`;
    const deviceType: string = (device.device_type === 'drycontact') ? device.drycontact_type : device.device_type;
    const deviceTypeConfig: DeviceType<any, any> = deviceTypeMap[deviceType];
    if (!deviceTypeConfig) {
      this.log.error('Invalid device type:', deviceType);
      return;
    }
    const { deviceClass, listener, uniqueArgs, idEnding } = deviceTypeConfig;
    let uniqueIDSuffix = `.${device.device_address}`;
    if (idEnding(device)) {
      uniqueIDSuffix = `${uniqueIDSuffix}.${idEnding(device)}`;
    }
    const uniqueID = `${uniqueIDPrefix}.${uniqueIDSuffix}`;
    const uuid: string = this.api.hap.uuid.generate(uniqueID);
    let deviceObj: ABCDevice;
    let listenerObj: ABCListener;
    if (addressedDeviceMap.has(deviceAddress)) {
      ({ deviceObj, listenerObj } = addressedDeviceMap.get(deviceAddress));
    } else {
      deviceObj = busObj.device(deviceAddress);
      listenerObj = new listener(deviceObj, controllerObj);
      addressedDeviceMap.set(deviceAddress, { deviceObj, listenerObj });
    }
    const commonArgs = [device.device_name, controllerObj, deviceObj, listenerObj];
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
    buildDevice(this, existingAccessory, deviceClass, commonArgs, uniqueArgs(device), uuid);
  }
}

function buildDevice(
  platform: HDLBusproHomebridge,
  accessory: PlatformAccessory | undefined,
  deviceClass: new (...args: any[]) => ABCDevice,
  commonArgs: any[],
  uniqueArgs: any[],
  uuid: string
  ) {
  if (accessory) {
    platform.log.info('Restoring existing accessory from cache:', accessory.displayName);
  } else {
    platform.log.info('Adding new accessory:', commonArgs[0]);
    accessory = new platform.api.platformAccessory(commonArgs[0], uuid);
    platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }
  new deviceClass(platform, accessory, ...commonArgs, ...uniqueArgs);
}