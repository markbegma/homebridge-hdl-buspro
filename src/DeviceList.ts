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

export const deviceTypeMap = {
    'relaylightbulb': {
        deviceClass: RelayLightbulb,
        listener: RelayListener,
        uniqueArgs: (device) => [device.channel],
        idEnding: (device) => `${device.channel}`
    },
    'relaydimmablelightbulb': {
        deviceClass: RelayDimmableLightbulb,
        listener: RelayListener,
        uniqueArgs: (device) => [device.channel],
        idEnding: (device) => `${device.channel}`
    },
    'sensor8in1': {
        deviceClass: Sensor8in1,
        listener: SensorListener,
        uniqueArgs: (device) => [],
        idEnding: (device) => ``
    },
    'relaylock': {
        deviceClass: RelayLock,
        listener: RelayListener,
        uniqueArgs: (device) => [device.channel, device.nc, device.lock_timeout],
        idEnding: (device) => `${device.channel}`
    },
    'relaycurtains': {
        deviceClass: RelayCurtains,
        listener: RelayCurtainListener,
        uniqueArgs: (device) => [device.channel, device.nc, device.duration, device.curtains_precision],
        idEnding: (device) => `${device.channel}`
    },
    'relaycurtainvalve': {
        deviceClass: RelayCurtainValve,
        listener: RelayCurtainListener,
        uniqueArgs: (device) => [device.channel, device.nc, device.valvetype],
        idEnding: (device) => `${device.channel}`
    },
    'contactsensor': {
        deviceClass: ContactSensor,
        listener: DryListener,
        uniqueArgs: (device) => [device.area, device.channel, device.nc],
        idEnding: (device) => `${device.area}.${device.channel}`
    },
    'leaksensor': {
        deviceClass: LeakSensor,
        listener: DryListener,
        uniqueArgs: (device) => [device.area, device.channel, device.nc],
        idEnding: (device) => `${device.area}.${device.channel}`
    },
    'smokesensor': {
        deviceClass: SmokeSensor,
        listener: DryListener,
        uniqueArgs: (device) => [device.area, device.channel, device.nc],
        idEnding: (device) => `${device.area}.${device.channel}`
    },
    'occupancysensor': {
        deviceClass: OccupancySensor,
        listener: DryListener,
        uniqueArgs: (device) => [device.area, device.channel, device.nc],
        idEnding: (device) => `${device.area}.${device.channel}`
    }
};
