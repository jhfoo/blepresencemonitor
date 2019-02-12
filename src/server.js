const restify = require('restify'),
    corsMiddleware = require('restify-cors-middleware'),
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    config = require('./conf/config'),
    BleManager = require('./BleManager');


log4js.configure(config.log4js);
logger.level = 'debug';

const BleMgr = new BleManager();

const server = restify.createServer();

// enable CORS
const cors = corsMiddleware({
    origins: ['*']
})
server.pre(cors.preflight);
server.use(cors.actual);

server.get('/svc/stop', (req, res, next) => {
    logger.info('Stopping service');
    BleMgr.stopScanning();
    res.send({
        status: 'OK'
    });
    next();
    server.close(() => {
        logger.info('Stopped service');
        // need this to force process termination as Noble has no feature to stop monitoring
        process.exit(0);
    });
});

server.get('/ble/start', (req, res, next) => {
    BleMgr.startScanning()
        .then(() => {
            res.send({
                status: 'OK'
            });
            next();
        })
        .catch((err) => {
            logger.error(err);
            res.send({
                status: 'ERROR',
                message: err
            });
            next();
        });
});

server.get('/ble/peripheral/track/:PeriId', (req, res, next) => {
    BleMgr.trackPeripheral(req.params.PeriId);
    res.send({
        status: 'OK'
    });
});

server.get('/ble/peripheral/all', (req, res, next) => {

    res.send({
        status: 'OK',
        data: BleMgr.getPeripherals()
    });
});

server.get('/ble/stop', (req, res, next) => {
    BleMgr.stopScanning();
    res.send({
        status: 'OK'
    });
});

server.get('/ble/state', (req, res, next) => {
    BleMgr.getState();
    res.send({
        status: 'OK',
        data: BleMgr.getState()
    });
});

server.listen(config.service.port, () => {
    logger.info('%s listening at %s', server.name, server.url);
});