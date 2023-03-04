import { RelayLightbulb, RelayListener } from './RelayLightbulb';
import { RelayDimmableLightbulb } from './RelayDimmableLightbulb';
import { Sensor8in1 } from './Sensor8in1';
import { RelayLock } from './RelayLock';
import { LeakSensor } from './LeakSensor';
import { ContactSensor } from './ContactSensor';
import { RelayCurtains } from './RelayCurtains';
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
