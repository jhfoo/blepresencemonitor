'use strict';

const Lru = require('../src/lib/lru'),
    lru = new Lru();

describe('empty queue', () => {
    test('getOldestNode(): null', () => {
        expect(lru.getOldestNode()).toBe(null);
    });

});

describe('insert 1 item', () => {
    test('insertNode(): 1st insert', () => {
        expect(lru.insertNode({
            id: '1000',
            name: 'test'
        }, 'id')).toBe(true);
    });

    test('getItemIdsByAge(true): 1000', () => {
        expect(lru.getItemIdsByAge()).toEqual(['1000']);
    });

    test('getItemIdsByAge(false): 1000', () => {
        expect(lru.getItemIdsByAge(false)).toEqual(['1000']);
    });
});

describe('insert 2 items', () => {

    test('insertNode(): 2nd insert', () => {
        expect(lru.insertNode({
            id: '2000',
            name: 'test'
        }, 'id')).toBe(false);
    });

    test('getItemIdsByAge(): 2000, 1000', () => {
        expect(lru.getItemIdsByAge()).toEqual(['2000', '1000']);
    });

    test('getItemIdsByAge(false): 1000, 2000', () => {
        expect(lru.getItemIdsByAge(false)).toEqual(['1000', '2000']);
    });
});

describe('reset latest item', () => {
    test('renewNode(): renew latest in list', () => {
        expect(lru.renewNode({
            id: '2000',
            name: 'test'
        }, 'id')).toBe(false);
    });

    test('getItemIdsByAge(): 2000, 1000', () => {
        expect(lru.getItemIdsByAge()).toEqual(['2000', '1000']);
    });

    test('getItemIdsByAge(false): 1000, 2000', () => {
        expect(lru.getItemIdsByAge(false)).toEqual(['1000', '2000']);
    });

    test('getOldestNode(): id = 1000', () => {
        expect(lru.getOldestNode().id).toBe('1000');
    });
});

describe('renew oldest item', () => {
    test('renewNode(): renew oldest in list', () => {
        expect(lru.renewNode({
            id: '1000',
            name: 'test'
        }, 'id')).toBe(true);
    });

    test('getOldestNode(): id = 2000', () => {
        expect(lru.getOldestNode().id).toBe('2000');
    });

    test('getItemIdsByAge(): 1000, 2000', () => {
        expect(lru.getItemIdsByAge()).toEqual(['1000', '2000']);
    });

    test('getItemIdsByAge(false): 2000, 1000', () => {
        expect(lru.getItemIdsByAge(false)).toEqual(['2000', '1000']);
    });
});

describe('removeExpiredItems()', () => {
    test('empty list: []', () => {
        lru.clearAll();
        expect(lru.removeExpiredItems()).toEqual([]);
    });

    test('1 in queue, 1 expired item: [1000]', (done) => {
        lru.clearAll();
        lru.activateTimer(false);
        lru.insertOrRenewItem({
            id: '1000'
        }, 'id');
        setTimeout(() => {
            try {
                expect(lru.removeExpiredItems().map((item) => {
                    return item.id;
                })).toEqual(['1000']);
                done();
            } catch (err) {
                done.fail(err);
            }
        }, 4 * 1000);
    });

    test('2 in queue, 1 expired item: [1000]', (done) => {
        lru.clearAll();
        lru.activateTimer(false);
        lru.insertOrRenewItem({
            id: '1000'
        }, 'id');
        // add another item 2sec later
        setTimeout(() => {
            lru.insertOrRenewItem({
                id: '2000'
            }, 'id');
            // check expired items 2sec later
            setTimeout(() => {
                try {
                    expect(lru.removeExpiredItems().map((item) => {
                        return item.id;
                    })).toEqual(['1000']);
                    done();
                } catch (err) {
                    done.fail(err);
                }
            }, 2 * 1000);
        }, 2 * 1000);
    });

    test('2 in queue, 2 expired item: [1000,2000]', (done) => {
        lru.clearAll();
        lru.activateTimer(false);
        lru.insertOrRenewItem({
            id: '1000'
        }, 'id');
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        // add another item 1sec later
        setTimeout(() => {
            lru.insertOrRenewItem({
                id: '2000'
            }, 'id');
            // check expired items 2sec later
            setTimeout(() => {
                try {
                    expect(lru.removeExpiredItems().map((item) => {
                        return item.id;
                    })).toEqual(['1000','2000']);
                    done();
                } catch (err) {
                    done.fail(err);
                }
            }, 4 * 1000);
        }, 1 * 1000);
    });

});

describe('misc', () => {
    test('TimeoutSec(): GET', () => {
        expect(lru.TimeoutSec()).toBe(Lru.DEFAULT_TIMEOUTSEC());
    });

    test('TimeoutSec(): SET', () => {
        expect(lru.TimeoutSec(5)).toBe(5);
    });

    test('clearAll(): empty list', () => {
        lru.clearAll();
        expect(lru.getItemIdsByAge()).toEqual([]);
        expect(lru.getOldestNode()).toBe(null);
    });
});