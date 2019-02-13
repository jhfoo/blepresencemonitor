'use strict';
const noble = require('noble'),
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    dayjs = require('dayjs'),
    PeripheralTracker = require('./lib/PeripheralTracker'),
    lru = require('./lib/lru');

var LruPeripherals = new lru();

class BleManager {
    constructor() {
        this.TrackedPeripheralId = '';
        this.peripherals = {};
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
                        TxPowerLevel: peri.advertisement.txPowerLevel ? peri.advertisement.txPowerLevel : '',
                        localName: peri.advertisement.localName ? peri.advertisement.localName : '' 
                    },
                    rssi: peri.rssi,
                    connectable: peri.connectable,
                    address: peri.address,
                    AddressType: peri.addressType
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

                var serviceData = peri.advertisement.serviceData;
                // if (serviceData && serviceData.length) {
                //     console.log('\there is my service data:');
                //     for (var i in serviceData) {
                //         console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
                //     }
                // }
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
    trackPeripheral(PeriId) {
        this.TrackedPeripheralId = PeriId;
    }
    getPeripherals() {
        return this.peripherals;
    }
    getState() {
        return {
            state: noble.state,
            isScanning: this.isScanning,
            TrackedPeripheralId: this.TrackedPeripheralId
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