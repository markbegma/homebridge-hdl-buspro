# Changelog

## 2.2.2 (2024-12-15)

Fixed plugin discovery error

## 2.2.1 (2024-12-15)

- [+] Added new relay lock custom usage by courtesy of @jainvandit99
- [+] New linting and building rules for Homebridge 2.0 readiness
- [-] Drop support for some earlier Node versions as a result

## 2.2.0 (2023-04-02)

- [+] Massive codestyle rehaul
- [+] Added support for more DryContact sensor types
- [+] Lights' stati are now infered after reload
- [+] Fixed dimmer brightness bug
- [+] Massively reduced traffic of status response by making it relay-wide
- [+] Fixed security issues
- [+] More log details and handlers for errors
- [?] Angular interface still not fixed because I have no idea how it works

## 2.1.2 (2021-04-30)

- [+] Fixed a relay valve status bug

## 2.1.1 (2021-04-29)

- [+] Fixes to bad behavior of relay locks and curtains

## 2.0.1 (2021-04-28)

- [+] Added support for Relay Curtains and custom Relay Curtain Valve
- [+] Added an option to auto close relay lock after some time
- [+] Slight fixes to Lightbulbs code

[!] Note: There is an issue with angular json form that for some reason hides devices and subnets that were already added to config under the "Add" buttons. I am currently looking into this, in the meanwhile it might be safer to check config.json directly to make sure everything is ok
