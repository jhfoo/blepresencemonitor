'use strict';

const log4js = require('log4js'),
    logger = log4js.getLogger(),
    moment = require('moment');

var peripherals = {};

module.exports = {
    registerPing: (device) => {
        var LastPingIntervalSec = -1;

        if (!peripherals[device.id]) {
            peripherals[device.id] = device;
        } else {
            LastPingIntervalSec = moment().diff(peripherals[device.id].DateTimeLastPing,'seconds')    
        }

        peripherals[device.id].DateTimeLastPing = moment();

        return LastPingIntervalSec;
    }
};