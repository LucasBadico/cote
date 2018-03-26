const R = require('ramda');
const axon = require('@LucasBadico/axon');
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
        var selfOn = this;
        super.on(type, (...args) => {
            var selfSuper = this;
            const rv = listener(...args);

            if (rv && typeof rv.then == 'function') {
                const cb = args.pop();
                if (typeof cb === 'function') {
                    rv.then((...args) => cb(null, ...args)).catch((...args) => cb(...args));
                } else {
    
                }
               
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
