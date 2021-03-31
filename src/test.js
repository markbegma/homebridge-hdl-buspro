var SmartBus = require('smart-bus');
var bus = new SmartBus({
  device: '1.50',
  gateway: '10.0.1.70',
  port: 6000
});
var sensor = bus.device('1.13');
bus.send({
  sender: '1.55',
  target: sensor,
  command: 0x0031,
  data: { channel: 6, level: 100 }
 }, function(err) {
  if (err) console.error('Failed to send command');
  else console.log('Success');
});
let a = 0;
function geta() { return a; };

var myfunc = function(command) {
  console.log(command.data);
  a = command.data.temperature;
  console.log('from inside ' + geta());
  return command.data;
};


var getter = async() => {
  let b = await sensor.on(0x0032, myfunc);
  console.log('b is ' + b);
}
getter();
console.log('from outside ' + geta());

setTimeout((function() {
    return process.exit(22);
}), 1000);