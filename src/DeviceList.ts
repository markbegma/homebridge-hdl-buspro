/* eslint-disable @typescript-eslint/no-explicit-any */

import { ABCDevice, ABCListener } from './ABC';
import { RelayLightbulb, RelayListener } from './RelayLightbulb';
import { RelayDimmableLightbulb } from './RelayDimmableLightbulb';
import { Sensor8in1, SensorListener } from './Sensor8in1';
import { RelayLock } from './RelayLock';
import { LeakSensor } from './LeakSensor';
import { SmokeSensor } from './SmokeSensor';
import { OccupancySensor } from './OccupancySensor';
import { ContactSensor, DryListener } from './ContactSensor';
import { RelayCurtains, RelayCurtainListener } from './RelayCurtains';
import { RelayCurtainValve } from './RelayCurtainValve';
import { RelayFan } from './RelayFan';

export interface DeviceType<T extends ABCDevice, U extends ABCListener> {
  deviceClass: new (...args: any[]) => T;
  listener: new (...args: any[]) => U;
  uniqueArgs: (config: Record<string, any>) => any[];
  idEnding: (config: Record<string, any>) => string;
}


export const deviceTypeMap: {[key: string]: DeviceType<any, any>} = {
  'relaylightbulb': {
    deviceClass: RelayLightbulb,
    listener: RelayListener,
    uniqueArgs: (config) => [config.channel],
    idEnding: (config) => `${config.channel}`,
  },
  'relaydimmablelightbulb': {
    deviceClass: RelayDimmableLightbulb,
    listener: RelayListener,
    uniqueArgs: (config) => [config.channel],
    idEnding: (config) => `${config.channel}`,
  },
  // Fan support
  'relayfan': {
    deviceClass: RelayFan,
    listener: RelayListener,
    uniqueArgs: (config) => [config.channel],
    idEnding: (config) => `${config.channel}`,
  },
  'sensor8in1': {
    deviceClass: Sensor8in1,
    listener: SensorListener,
    uniqueArgs: () => [],
    idEnding: () => '',
  },
  'relaylock': {
    deviceClass: RelayLock,
    listener: RelayListener,
    uniqueArgs: (config) => [config.channel, config.nc, config.lock_timeout],
    idEnding: (config) => `${config.channel}`,
  },
  'relaycurtains': {
    deviceClass: RelayCurtains,
    listener: RelayCurtainListener,
    uniqueArgs: (config) => [config.channel, config.nc, config.duration, config.curtains_precision],
    idEnding: (config) => `${config.channel}`,
  },
  'relaycurtainvalve': {
    deviceClass: RelayCurtainValve,
    listener: RelayCurtainListener,
    uniqueArgs: (config) => [config.channel, config.nc, config.valvetype],
    idEnding: (config) => `${config.channel}`,
  },
  'contactsensor': {
    deviceClass: ContactSensor,
    listener: DryListener,
    uniqueArgs: (config) => [config.area, config.channel, config.nc],
    idEnding: (config) => `${config.area}.${config.channel}`,
  },
  'leaksensor': {
    deviceClass: LeakSensor,
    listener: DryListener,
    uniqueArgs: (config) => [config.area, config.channel, config.nc],
    idEnding: (config) => `${config.area}.${config.channel}`,
  },
  'smokesensor': {
    deviceClass: SmokeSensor,
    listener: DryListener,
    uniqueArgs: (config) => [config.area, config.channel, config.nc],
    idEnding: (config) => `${config.area}.${config.channel}`,
  },
  'occupancysensor': {
    deviceClass: OccupancySensor,
    listener: DryListener,
    uniqueArgs: (config) => [config.area, config.channel, config.nc],
    idEnding: (config) => `${config.area}.${config.channel}`,
  },
};
