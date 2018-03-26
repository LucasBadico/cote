const R = require('ramda');
const axon = require('@dashersw/axon');
const portfinder = require('portfinder');
const Configurable = require('./configurable');
const Component = require('./component');

module.exports = class Responder extends Configurable(Component) {
    constructor(advertisement, discoveryOptions) {
        super(advertisement, discoveryOptions);

        this.sock = new axon.types[this.type]();
        this.sock.on('bind', () => this.startDiscovery());

        this.sock.on('message', (req, cb) => {
            if (!req.type) return;

            this.emit(req.type, req, cb);
        });

        const onPort = (err, port) => {
            this.advertisement.port = +port;

            this.sock.bind(port);
            this.sock.server.on('error', (err) => {
                if (err.code != 'EADDRINUSE') throw err;

                portfinder.getPort({
                    host: this.discoveryOptions.address,
                    port: this.advertisement.port,
                }, onPort);
            });
        };

        portfinder.getPort({
            host: this.discoveryOptions.address,
            port: advertisement.port,
        }, onPort);
    }

    on(type, listener) {
        super.on(type, (...args) => {
            const rv = listener(...args);
            console.log('FROM RESPONDER', { type, listener, rv, args }, rv && typeof rv.then == 'function')

            if (rv && typeof rv.then == 'function') {
                const cb = args.pop();
                // if (typeof cb === 'function') 
                rv.then((val) => cb(null, val)).catch(cb);
            }
        });
    }

    get type() {
        return 'rep';
    }

    get oppo() {
        return 'req';
    }
};
