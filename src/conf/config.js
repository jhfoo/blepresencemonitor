'use strict';

module.exports = {
    log4js: {
        appenders: {
            console: {
                type: 'console'
            },
            file: {
                type: 'file',
                filename:'./logs/server.log',
                maxLogSize: 256 * 1024,
                keepFileExt: true,
                backups: 3
            }
        },
        categories: {
            default: {
                appenders: ['console', 'file'],
                level: 'debug'
            }
        }
    }
};