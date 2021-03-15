import { HDLBusproHomebridge } from './platform';
import Bus from 'smart-bus-mrgadget';
//HDLBusproHomebridge.config.name

export class busser {
  
  private devicestr: string;

  constructor(
    private readonly ip: string,
    private readonly port: number,
    private readonly subnet: number,
    private readonly control: number,
    ) {

  this.devicestr = String(subnet).concat('.', String(control));
}

controldevice(): Bus {
  const bus = new Bus({
    device: this.devicestr,
    gateway: this.ip,
    port: this.port
  });
  return bus
};

}

export const bus = new Bus({
    device: "1.50",
    gateway: '10.0.1.70', // HDL SmartBus gateway IP
    port: 6000                // and port, default: 6000
  });