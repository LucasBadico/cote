const axon = require('@dashersw/axon');
const portfinder = require('portfinder');
const Configurable = require('./configurable');
const Component = require('./component');

module.exports = class Responder extends Configurable(Component) {
    constructor(advertisement, discoveryOptions) {
        super(advertisement, discoveryOptions);

        this.sock = new axon.types[this.type]();
        this.sock.on('bind', () => this.startDiscovery());

        this.sock.on('message', (req, ...args) => {
            if (!req.type) return;

            this.emit(req.type, req, ...args);
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
            // resolution of listeners
            const rv = listener(...args);
            const hasCallback = 
                'boolean' === typeof args[args.length - 1] &&
                args[args.length - 1] === true &&
                arg.length > 1  &&
                'function' === typeof args[args.length - 2];

            if (hasCallback && 'function' === typeof rv.then) {
                const cb = args[args.length - 2];
                return rv.then((val) => cb(null, val)).catch(cb);
            }
            return rv
        });
    }

    get type() {
        return 'rep';
    }

    get oppo() {
        return 'req';
    }
};
