'use strict';

const PeripheralTracker = require('../src/lib/PeripheralTracker');

test('registerPing(): first call === -1', () => {
    expect(PeripheralTracker.registerPing({
        id: '1000',
        name: 'test'
    })).toBe(-1);
});

test('registerPing(): second call == 1', (done) => {
    setTimeout(() => {
        try {
            expect(PeripheralTracker.registerPing({
                id: '1000',
                name: 'test'
            })).toBe(1);
            done();
        } catch(err) {
            done.fail(err);
        }
    }, 1000);
});