'use strict';

const Lru = require('../src/lib/lru'),
    lru = new Lru();

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