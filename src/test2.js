var SmartBus = require('smart-bus');
var bus = new SmartBus({
  device: '1.50',
  gateway: '10.0.1.70',
  port: 6000
});
var sensor = bus.device('1.21');
bus.send({
  sender: '1.50',
  target: sensor,
  command: 0x1645,
 }, function(err) {
  if (err) console.error('Failed to send command');
  else console.log('Success');
});

var myfunc = function(command) {
  console.log(command.data);
  return command.data;
};

sensor.on(0x1646, myfunc);
//console.log(a);

setTimeout((function() {
    return process.exit(22);
}), 1000);