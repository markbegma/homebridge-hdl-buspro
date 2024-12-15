import { API } from 'homebridge';

import { HDLBusproHomebridge } from './HDLPlatform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HDLBusproHomebridge);
};
