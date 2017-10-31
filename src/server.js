const noble = require('noble'),
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    moment = require('moment'),
    PeripheralTracker = require('./lib/PeripheralTracker');

logger.level = 'debug';

noble.on('stateChange', (data) => {
    console.log('Event:stateChange ' + data);

    if (data === 'poweredOn') {
        noble.startScanning([], true, (err, service) => {
            //        noble.startScanning(['adabfb006e7d4601bda2bffaa68956ba'], true, (err, service) => {
            if (err) {
                console.log('Error: %s', err);
            } else {
                console.log('Service: %s', service);
            }
        });
    }
});

noble.on('discover', (peri) => {
    if (peri.advertisement.serviceUuids.indexOf('adabfb006e7d4601bda2bffaa68956ba') === -1 &&
        peri.advertisement.localName != 'Tile')
        return;
    // console.log('%s: %s', peri.advertisement.localName, peri.advertisement.serviceUuids[0] );

    var LastIntervalSec = PeripheralTracker.registerPing({
        id: peri.id,
        name: peri.advertisement.localName
    });
    if (LastIntervalSec === -1) {
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
        logger.info('Event:discover %s', JSON.stringify({
            id: peri.id,
            LastAdvertisedSec: LastIntervalSec,
            localName: peri.advertisement.localName
        }, null, 2));
    }
});