import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HDLBusproHomebridge } from 'homebridge-hdl-buspro/src/HDLPlatform';
export declare class Sensor8in1 {
    private readonly platform;
    private readonly accessory;
    private readonly temp_name;
    private readonly brightness_name;
    private readonly motion_name;
    private readonly sound_name;
    private readonly ip;
    private readonly port;
    private readonly control;
    private readonly subnet;
    private readonly device;
    private temp_service;
    private brightness_service;
    private motion_service;
    private sound_service;
    private SensorStates;
    private cdnstr;
    private devicestr;
    private bus;
    constructor(platform: HDLBusproHomebridge, accessory: PlatformAccessory, temp_name: string, brightness_name: string, motion_name: string, sound_name: string, ip: string, port: number, control: number, subnet: number, device: number);
    handleCurrentTemperatureGet(): Promise<CharacteristicValue>;
    handleCurrentAmbientLightLevelGet(): Promise<CharacteristicValue>;
    handleMotionDetectedGet(): Promise<CharacteristicValue>;
    handleMuteGet(): Promise<CharacteristicValue>;
}
//# sourceMappingURL=Sensor8in1.d.ts.map