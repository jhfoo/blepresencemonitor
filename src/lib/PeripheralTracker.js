'use strict';

const log4js = require('log4js'),
    logger = log4js.getLogger(),
    dayjs = require('dayjs');

var peripherals = {};

module.exports = {
    registerPing: (device) => {
        var LastPingIntervalSec = -1;

        if (!peripherals[device.id]) {
            peripherals[device.id] = device;
        } else {
            LastPingIntervalSec = dayjs().diff(peripherals[device.id].DateTimeLastPing,'seconds')    
        }

        peripherals[device.id].DateTimeLastPing = dayjs();

        return LastPingIntervalSec;
    }
};