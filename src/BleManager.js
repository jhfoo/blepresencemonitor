'use strict';
const noble = require('noble'),
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    moment = require('moment'),
    dayjs = require('dayjs'),
    PeripheralTracker = require('./lib/PeripheralTracker'),
    lru = require('./lib/lru');

var LruPeripherals = new lru();

class BleManager {
    constructor() {
        this.peripherals = {
            TrackedPeripheralId: ''
        };
        this.isScanning = false;
        let self = this;

        noble.on('scanStart', () => {
            logger.debug('Scanning started');
            self.isScanning = true;
        });

        noble.on('scanStop', () => {
            logger.debug('Scanning stopped');
            self.isScanning = false;
        });

        noble.on('stateChange', (data) => {
            console.log('Event:stateChange ' + data);
        });

        noble.on('discover', (peri) => {
            // console.log('************* DISCOVER ****************')
            // console.log(peri);
            this.peripherals[peri.id] = {
                DateTimeUpdated: dayjs(),
                data: {
                    id: peri.id,
                    uuid: peri.uuid,
                    advertisement: {
                        ServiceUuids: peri.advertisement.serviceUuids,
                        manufacturerId: peri.advertisement.manufacturerData ? peri.advertisement.manufacturerData.toString('hex') : '',
                        localName: peri.advertisement.localName ? peri.advertisement.localName : '' 
                    },
                    rssi: peri.rssi,
                    address: peri.address
                }
            };
            if (peri.id != this.TrackedPeripheralId)
                return;
            // console.log('%s: %s', peri.advertisement.localName, peri.advertisement.serviceUuids[0] );

            var LastIntervalSec = PeripheralTracker.registerPing({
                id: peri.id,
                name: peri.advertisement.localName
            });

            if (LastIntervalSec === -1) {
                // first msg received from peripheral
                logger.info('Event:discover ' + peri);

                console.log('peri discovered (' + peri.id +
                    ' with address <' + peri.address + ', ' + peri.addressType + '>,' +
                    ' connectable ' + peri.connectable + ',' +
                    ' RSSI ' + peri.rssi + ':');
                console.log('\thello my local name is:');
                console.log('\t\t' + peri.advertisement.localName);
                console.log('\tcan I interest you in any of the following advertised services:');
                console.log('\t\t' + JSON.stringify(peri.advertisement.serviceUuids));

                var serviceData = peri.advertisement.serviceData;
                if (serviceData && serviceData.length) {
                    console.log('\there is my service data:');
                    for (var i in serviceData) {
                        console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
                    }
                }
                if (peri.advertisement.manufacturerData) {
                    console.log('\there is my manufacturer data:');
                    console.log('\t\t' + JSON.stringify(peri.advertisement.manufacturerData.toString('hex')));
                }
                if (peri.advertisement.txPowerLevel !== undefined) {
                    console.log('\tmy TX power level is:');
                    console.log('\t\t' + peri.advertisement.txPowerLevel);
                }
            } else {
                // recurring msg received from peripheral
                var uuids = peri.advertisement.serviceUuids;
                var item = {
                    id: peri.id,
                    uuids: uuids ? uuids : [],
                    LastAdvertisedSec: LastIntervalSec,
                    localName: peri.advertisement.localName ? peri.advertisement.localName : 'Unknown Peripheral'
                };

                logger.info('Event:discover %s', JSON.stringify(item, null, 2));
                var count = LruPeripherals.insertOrRenewItem(item, 'id');
                logger.debug('Oldest peripheral: %s', LruPeripherals.getOldestItem().localName);
                logger.debug('Aged peripherals: %s', LruPeripherals.getItemsByAge().map((item) => {
                    return item.localName + ' (' + item.id + ')';
                }).join(','));
            };
        });
    }
    TrackedPeripheral(PeriId) {
        this.TrackedPeripheralId = PeriId;
    }
    getPeripherals() {
        return this.peripherals;
    }
    getState() {
        return {
            state: noble.state,
            isScanning: this.isScanning
        };
    }
    startScanning() {
        return new Promise((resolv, reject) => {
            noble.startScanning([], true, (err) => {
                //        noble.startScanning(['adabfb006e7d4601bda2bffaa68956ba'], true, (err, service) => {
                if (err) {
                    reject(err);
                } else {
                    resolv();
                }
            });
            // noble.startScanning((err) => {});
        });
    }
    stopScanning() {
        noble.stopScanning();
        return;
    }
}

module.exports = BleManager;