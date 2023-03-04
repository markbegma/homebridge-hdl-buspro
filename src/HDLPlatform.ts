/* eslint-disable max-len */
/* eslint-disable no-var */
/* eslint-disable no-case-declarations */
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import Bus from 'smart-bus';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { RelayLightbulb } from './RelayLightbulb';
import { RelayDimmableLightbulb } from './RelayDimmableLightbulb';
import { Sensor8in1 } from './Sensor8in1';
import { RelayLock } from './RelayLock';
import { LeakSensor } from './LeakSensor';
import { ContactSensor } from './ContactSensor';
import { RelayCurtains } from './RelayCurtains';
import { RelayCurtainValve } from './RelayCurtainValve';

const deviceTypeMap = {
  'relaylightbulb': {
    deviceClass: RelayLightbulb,
    uniqueArgs: (device) => [device.channel],
    idEnding: (device) => `${device.channel}`
  },
  'relaydimmablelightbulb': {
    deviceClass: RelayDimmableLightbulb,
    uniqueArgs: (device) => [device.channel],
    idEnding: (device) => `${device.channel}`
  },
  'sensor8in1': {
    deviceClass: Sensor8in1,
    uniqueArgs: (device) => [],
    idEnding: (device) => ``
  },
  'relaylock': {
    deviceClass: RelayLock,
    uniqueArgs: (device) => [device.channel, device.nc, device.lock_timeout],
    idEnding: (device) => `${device.channel}`
  },
  'relaycurtains': {
    deviceClass: RelayCurtains,
    uniqueArgs: (device) => [device.channel, device.nc, device.duration, device.curtains_precision],
    idEnding: (device) => `${device.channel}`
  },
  'relaycurtainvalve': {
    deviceClass: RelayCurtainValve,
    uniqueArgs: (device) => [device.channel, device.nc, device.duration, device.valvetype],
    idEnding: (device) => `${device.channel}`
  },
  'contactsensor': {
    deviceClass: ContactSensor,
    uniqueArgs: (device) => [device.area, device.channel, device.nc],
    idEnding: (device) => `${device.area}.${device.channel}`
  },
  'leaksensor': {
    deviceClass: LeakSensor,
    uniqueArgs: (device) => [device.area, device.channel, device.nc],
    idEnding: (device) => `${device.area}.${device.channel}`
  }
};

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
        const controllerObj = bus.controller(`${subnet}.${cd_number}`);
        const addressedDeviceMap = new Map();
        for (const device of subnet.devices) {
          const deviceAddress = `${subnet}.${device.device_address}`;
          let deviceObj;
          if (addressedDeviceMap.has(deviceAddress)) {
            deviceObj = addressedDeviceMap.get(deviceAddress);
          } else {
            deviceObj = bus.device(deviceAddress);
            addressedDeviceMap.set(deviceAddress, deviceObj);
          }
          const commonArgs = [device.device_name, controllerObj, deviceObj];
          const deviceType = (device.device_type === 'drycontact') ? device.drycontact_type : device.device_type;
          const deviceTypeConfig = deviceTypeMap[deviceType];
          if (!deviceTypeConfig) {
            this.log.error('Invalid device type:', deviceType);
            continue;
          }
          const { deviceClass, uniqueArgs, idEnding } = deviceTypeConfig;
          const uniqueID = `${ip}:${port}.${subnet_number}.${device.device_address}.${idEnding(device)}`;
          const uuid = this.api.hap.uuid.generate(uniqueID);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
          buildDevice(this, existingAccessory, deviceClass, commonArgs, uniqueArgs(device), uuid);
        }
      }
    }
  }
}
