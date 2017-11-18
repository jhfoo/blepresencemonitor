'use strict';

const log4js = require('log4js'),
    logger = log4js.getLogger(),
    moment = require('moment'),
    ID_DUMMY_NODE = 'DUMMYID';

class Lru {
    constructor() {
        this.clearHashNLinkedList();
        this.timer = null;
        this.IsTimerActive = true;
        this._TimeoutSec = Lru.DEFAULT_TIMEOUTSEC();
    }
    static DEFAULT_TIMEOUTSEC() {
        return 5;
    }
    activateTimer(IsActive) {
        // active timers really call setTimeout()
        if (this.timer != null) 
            this.clearTimer();
        this.IsTimerActive = IsActive;
    }
    TimeoutSec(NewTimeoutSec) {
        if (NewTimeoutSec) {
            // set
            this._TimeoutSec = NewTimeoutSec;
        }
        return this._TimeoutSec;
    }
    insertOrRenewItem(item, key) {
        var PrevOldestNode = this.OldestNode;

        var IsResetTimer;
        if (this.nodes[item[key]]) {
            // renew node
            IsResetTimer = this.renewNode(item, key)
        } else {
            // insert new node
            IsResetTimer = this.insertNode(item, key)
        }

        logger.debug('Newest node: %s', this.LatestNode.data[key]);
        if (IsResetTimer) {
            // oldest node is refreshed: reset timeout
            this.clearTimer();
            this.startExpiryTimer();
        }
        return Object.keys(this.nodes).length;
    }
    renewNode(item, key) {
        var LastNode = this.LatestNode.PrevNode.PrevNode;

        // move node in linked list to the head as pointed by LatestNode
        logger.debug('Renewing item');

        var ThisNode = this.nodes[item[key]];
        // refresh data stored
        ThisNode.data = item;

        // reset timeout for node
        ThisNode.ExpireBy = moment().add(this._TimeoutSec, 's');

        // skip if node is already latest
        if (ThisNode != this.LatestNode) {
            // linked list has > 1 non-dummy nodes
            // link the node neighbours of the refreshed node to each other
            ThisNode.PrevNode.NextNode = ThisNode.NextNode;
            ThisNode.NextNode.PrevNode = ThisNode.PrevNode;

            // refreshed node is detached: link the end nodes to refreshed node
            ThisNode.NextNode = this.LatestNode;
            ThisNode.PrevNode = this.LatestNode.PrevNode;
            this.LatestNode.PrevNode.NextNode = ThisNode;
            this.LatestNode.PrevNode = ThisNode;

            // point LatestNode to node
            this.LatestNode = ThisNode;
        }

        // reset timer iff:
        // 1: only one non-dummy node
        // 2: renewed node is last in linked list (oldest)
        return this.LatestNode.NextNode.NextNode === this.LatestNode ||
            this.LatestNode === LastNode;
    }
    insertNode(item, key) {
        var IsFirstNodeDummy = this.LatestNode.id === ID_DUMMY_NODE;

        // register item
        var NewNode = {
            data: item,
            id: item[key],
            NewerNode: null,
            OlderNode: null,
            ExpireBy: moment().add(this._TimeoutSec, 's')
        };

        // update node hash
        this.nodes[item[key]] = NewNode;

        // update node pointers
        NewNode.PrevNode = this.LatestNode.PrevNode;
        NewNode.NextNode = this.LatestNode;

        // update neighbour nodes
        this.LatestNode.PrevNode.NextNode = NewNode;
        this.LatestNode.PrevNode = NewNode;

        // update LatestNode to new ndoe
        this.LatestNode = NewNode;

        logger.debug('Tracking new item (total %d)', Object.keys(this.nodes).length);

        return IsFirstNodeDummy;
    }
    startExpiryTimer() {
        // safety check
        if (this.timer != null) {
            logger.error('Unable to start timer: already in use');
            return;
        }

        // proceed is timer active
        if (!this.IsTimerActive)
            return;

        logger.debug('Setting timer %d sec', this._TimeoutSec);
        var self = this;
        this.timer = setTimeout(() => {
            logger.info('At least 1 node has expired');
            this.timer = null;
            self.removeExpiredItems();
        }, this._TimeoutSec * 1000);
    }
    popOldestItem(key) {

    }
    getOldestNode() {
        // skip past the null end node
        var ret = this.LatestNode.PrevNode.PrevNode;
        return ret.id === ID_DUMMY_NODE ? null : ret;
    }
    getOldestItem() {
        var ret = this.getOldestNode();
        return ret === null ? null : ret.data;
    }
    getItemsByAge(IsNewestFirst) {
        IsNewestFirst = typeof IsNewestFirst === 'undefined' ? true : IsNewestFirst;

        var ret = new Array();
        var ThisNode = IsNewestFirst ? this.LatestNode : this.LatestNode.PrevNode.PrevNode;
        var max = 5;
        while (ThisNode.id != ID_DUMMY_NODE) {
            ret.push(ThisNode.data);
            ThisNode = IsNewestFirst ? ThisNode.NextNode : ThisNode.PrevNode;
            max--;
            if (max === 0)
                break;
        }

        return ret;
    }
    getItemIdsByAge(IsNewestFirst) {
        return this.getItemsByAge(IsNewestFirst).map((item) => {
            return item.id;
        });
    }
    clearTimer() {
        // stop the timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    clearHashNLinkedList() {
        this.nodes = {
            dummy: {
                id: ID_DUMMY_NODE,
                data: null,
                NewerNode: null,
                OlderNode: null,
                ExpireBy: null
            }
        };
        // initialize linked list with a dummy node
        this.LatestNode = this.nodes.dummy;
        this.LatestNode.PrevNode = this.nodes.dummy;
        this.LatestNode.NextNode = this.nodes.dummy;
    }
    clearAll() {
        this.clearTimer();
        this.clearHashNLinkedList();
    }
    removeExpiredItems() {
        var ret = [];
        var OldestNode = this.getOldestNode();
        if (OldestNode === null)
            // empty list: exit
            return ret;

        // non-empty list
        while (OldestNode.id != ID_DUMMY_NODE &&
            OldestNode.ExpireBy.diff(moment(), 'seconds') <= 0) {
            // remove oldest node
            logger.info('Node id %s expired by %d secs', OldestNode.data.id, moment().diff(OldestNode.ExpireBy, 'seconds'));
            // remember node removed
            ret.push(OldestNode.data);
            // remove from hash
            delete this.nodes[OldestNode.id];
            // remove from linked list
            OldestNode.NextNode.PrevNode = OldestNode.PrevNode;
            OldestNode.PrevNode.NextNode = OldestNode.NextNode;
            // move to next oldest node
            OldestNode = OldestNode.PrevNode;
        }

        if (OldestNode.id === ID_DUMMY_NODE) {
            // empty list: point LatestNode to dummy node
            this.LatestNode = OldestNode;
        } else {
            // non-empty list: start timer
            this.startExpiryTimer();
        }

        logger.debug('Aged peripherals: %s', this.getItemsByAge().map((item) => {
            return item.localName + ' (' + item.id + ')';
        }).join(','));
        return ret;
    }
}

module.exports = Lru;