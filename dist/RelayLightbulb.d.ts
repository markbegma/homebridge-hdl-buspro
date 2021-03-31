import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { HDLBusproHomebridge } from 'homebridge-hdl-buspro/src/HDLPlatform';
export declare class RelayLightbulb {
    private readonly platform;
    private readonly accessory;
    private readonly lightname;
    private readonly ip;
    private readonly port;
    private readonly control;
    private readonly subnet;
    private readonly device;
    private readonly channel;
    private service;
    private RelayLightbulbStates;
    private cdnstr;
    private devicestr;
    private bus;
    constructor(platform: HDLBusproHomebridge, accessory: PlatformAccessory, lightname: string, ip: string, port: number, control: number, subnet: number, device: number, channel: number);
    setOn(value: CharacteristicValue): Promise<void>;
    getOn(): Promise<CharacteristicValue>;
}
//# sourceMappingURL=RelayLightbulb.d.ts.map