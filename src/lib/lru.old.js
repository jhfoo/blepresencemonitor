'use strict';

const log4js = require('log4js'),
    logger = log4js.getLogger(),
    moment = require('moment');

class Lru {
    constructor() {
        this.nodes = {};
        this.LatestNode = null;
        this.OldestNode = null;
        this.timer = null;
        this.TimeoutSec = 5;
    }
    insertOrRenewItem(item, key) {
        var PrevOldestNode = this.OldestNode;

        if (this.nodes[item[key]]) {
            // renew node
            logger.debug('Renewing item');

            var ThisNode = this.nodes[item[key]];
            // refresh data stored
            ThisNode.data = item;

            // reset timeout for node
            ThisNode.ExpireBy = moment().add(this.TimeoutSec, 's');

            // don't update if node is already latest
            if (ThisNode != this.LatestNode) {
                ThisNode.NewerNode.OlderNode = ThisNode.OlderNode;

                if (ThisNode === this.OldestNode)
                    this.OldestNode = ThisNode.NewerNode;
                else
                    ThisNode.OlderNode.NewerNode = ThisNode.NewerNode;

                ThisNode.OlderNode = this.LatestNode;
                ThisNode.OlderNode.NewerNode = ThisNode;

                // point LatestNode to node
                this.LatestNode = ThisNode;
            }
        } else {
            // insert new node
            // register item
            var NewNode = {
                data: item,
                id: item[key],
                NewerNode: null,
                OlderNode: null,
                ExpireBy: moment().add(this.TimeoutSec, 's')
            };
            this.nodes[item[key]] = NewNode;

            // update node pointers
            if (this.LatestNode === null) {
                // first node
                this.LatestNode = NewNode;
                this.OldestNode = NewNode;
            } else {
                // update LatestNode
                NewNode.OlderNode = this.LatestNode;
                this.LatestNode.NewerNode = NewNode;
                this.LatestNode = NewNode;
            }

            logger.debug('Tracking new item (total %d)', Object.keys(this.nodes).length);
        }

        logger.debug('Newest node: %s', this.LatestNode.data[key]);
        logger.debug('Oldest node: %s', this.OldestNode.data[key]);
        if (PrevOldestNode != this.OldestNode ||
            this.LatestNode === this.OldestNode) {
            // oldest node is refreshed: reset timeout
            if (this.timer != null) {
                // reset timeout
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.startExpiryTimer();
        }
        return Object.keys(this.nodes).length;
    }
    startExpiryTimer() {
        // safety check
        if (this.timer != null) {
            logger.error('Unable to start timer: already in use');
            return;
        }

        logger.debug('Setting timer %d sec', this.TimeoutSec);
        var self = this;
        this.timer = setTimeout(() => {
            logger.info('At least 1 node has expired');
            this.timer = null;
            self.removeExpiredNodes();
        }, this.TimeoutSec * 1000);
    }
    popOldestItem(key) {

    }
    getOldestItem(key) {
        return this.OldestNode.data;
    }
    getItemsByAge() {
        var ret = [];
        var ThisNode = this.LatestNode;
        var max = 5;
        while (ThisNode != null) {
            ret.push(ThisNode.data);
            ThisNode = ThisNode.OlderNode;
            max--;
            if (max === 0)
                break;
        }

        return ret;
    }
    removeExpiredNodes() {
        while (this.OldestNode != null &&
            this.OldestNode.ExpireBy.diff(moment(), 'seconds') <= 0) {
            // remove oldest node
            logger.info('Node id %s expired by %d secs', this.OldestNode.data.id, moment().diff(this.OldestNode.ExpireBy, 'seconds'));
            // remove from hash
            delete this.nodes[this.OldestNode.id];
            // update OldestNode pointer
            this.OldestNode = this.OldestNode.NewerNode;
        }
        if (this.OldestNode === null) {
            // empty list
            this.LatestNode = null;
        } else {
            // remove from linked list
            this.OldestNode.OlderNode = null;
            this.startExpiryTimer();
        }

        logger.debug('Aged peripherals: %s', this.getItemsByAge().map((item) => {
            return item.localName + ' (' + item.id + ')';
        }).join(','));
    }
}

module.exports = Lru;