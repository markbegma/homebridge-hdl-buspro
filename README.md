<span align="center">

# homebridge-hdl-buspro
## HomeKit integration for HDL Buspro relays

</span>

`homebridge-hdl-buspro` is a homebridge plugin to control your devices on the HDL Buspro buses from Home app on iOS. It currently supports the following types of devices:

### Features
* Relay Lightbulbs
* Relay Dimmable Lightbulbs
* Sensors 8 in 1 (dry contacts not supported yet)
* Dry contact relays (leak and contact sensors)
* Relay locks

Curtains, heaters and security systems will be supported in later versions, as well as more types of dry contact sensors.

## Installation

If you are new to homebridge, please first read the homebridge [documentation](https://www.npmjs.com/package/homebridge).
If you are running on a Raspberry, you will find a tutorial in the [homebridge wiki](https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-Raspbian).

Install homebridge:
```sh
sudo npm install -g homebridge
```

Install homebridge-hdl-buspro:
```sh
sudo npm install -g homebridge-hdl-buspro
```

## Configuration

Add the `HDLBusproHomebridge` platform in `config.json` in your home directory inside `.homebridge`.

This plugin cannot discover devices on its own, for this you should use software like HDL Buspro setup tool v2 (you can download it [here](https://drive.google.com/file/d/1RGmIUSlMDCgXJxu58fNRzN3IgQXzq8gI/view?usp=sharing)). Use it to get info on your bus ip, port, its subnets, devices and all separate channels on relays to use these numbers in config with your custom names. You should also give a number for a virtual device on each subnet that will be used by plugin to send and receive commands and data on behalf of this plugin. Just choose whatever number is not occupied by other devices.

Typical HDL structure goes like this: **bus-subnet-device-channel**

Example configuration:

```js
        {
            "buses": [
                "bus_name": "Main Bus",
                "bus_IP": "10.0.0.1",
                "bus_port": 6000
                {
                    "subnets": [
                        {
                            "subnet_number": 1,
                            "cd_number": 55,
                            "devices": [
                                {
                                    "device_name": "Living room lights",
                                    "device_address": 13,
                                    "device_type": "relaylightbulb",
                                    "channel": 4
                                },
                                {
                                    "device_name": "Dining room sensor",
                                    "device_address": 21,
                                    "device_type": "sensor8in1"
                                },
                                {
                                    "device_name": "Bathroom leak sensor",
                                    "device_address": 69,
                                    "device_type": "drycontact",
                                    "area": 1,
                                    "channel": 1,
                                    "drycontact_type": "leaksensor",
                                    "nc": false
                                },
                                {
                                    "device_name": "Garden backdoor",
                                    "device_address": 6,
                                    "device_type": "relaylock",
                                    "channel": 2,
                                    "nc": true
                                }
                            ]
                        }
                    ]
                }
            ],
            "platform": "HDLBusproHomebridge"
        },
```

### Parameters
#### Platform Configuration fields
- `platform` [required]
Should always be **"HDLBusproHomebridge"**.
- `buses` [required]
A list of your buses
#### Bus configuration fields
- `bus_name` [required]
Name of your bus.
- `bus_ip` [required]
ip address of your bus
- `port` [required]
port of your bus
- `subnets` [required]
A list of subnets on this bus
#### Subnet configuration fields
- `subnet_number` [required]
Separate number for each subnet
- `cd_number` [required]
Any unoccupied number on subnet to control your devices from
- `devices` [optional]
Add all devices on subnet you need
#### Subnet configuration fields
- `device_name` [optional]
Your custom name for device, will be shown in Home app by default
- `device_address` [required]
Number of device in subnet
- `device_type` [required]
Specify the type of device
  - Available values:
    - *"relaylightbulb"* - relay lights
    - *"relaydimmablelightbulb"* - relay dimmable lights
    - *"sensor8in1"* - multisensor
    - *"relaylock"* - custom use of light relay to control a lock
    - *"drycontact"* - dry contact relay
- `channel` [optional]
Specify channel for a specific light group or dry contact of relay
- `area` [optional]
Needed for some dry contact relays
- `nc` [required]
You can flip the logic of dry contact relay or lock with this parameter
- `drycontact_type` [required]
Specify what your dry contact sensor does
  - Available values:
    - *"leaksensor"* - leak sensor
    - *"contactsensor"* - contact sensor



## Troubleshooting
If you have any issues with the plugin or TV services then you can run homebridge in debug mode, which will provide some additional information. This might be useful for debugging issues.

Please keep in mind that I could only test how plugin works on devices I have at home, and some devices were coded only based on documentation. So feel free to open issues [here](https://github.com//markbegma/homebridge-hdl-buspro/issues) if you encounter problems/need your device supported!

Homebridge debug mode:
```sh
homebridge -D
```


## Special thanks
[caligo-mentis](https://github.com/caligo-mentis/smart-bus) for his great work on Node.js remote control module for HDL Buspro.
