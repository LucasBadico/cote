const Configurable = require('./configurable');
const Monitorable = require('./monitorable');
const Component = require('./component');
const axon = require('@dashersw/axon');

module.exports = class Requester extends Monitorable(Configurable(Component)) {
    constructor(advertisement, discoveryOptions) {
        super(advertisement, discoveryOptions);

        this.sock = new axon.types[this.type]();
        this.sock.set('retry timeout', 0);

        this.startDiscovery();
    }

    onAdded(obj) {
        super.onAdded(obj);

        const address = this.constructor.useHostNames ? obj.hostName : obj.address;

        const alreadyConnected = this.sock.socks.some((s) =>
            (this.constructor.useHostNames ? s._host == obj.hostName : s.remoteAddress == address) &&
             s.remotePort == obj.advertisement.port);

        if (alreadyConnected) return;

        this.sock.connect(obj.advertisement.port, address);
    }

    send(...args) {
        const hasCallback = 
            'boolean' === typeof args[args.length - 1] &&
            args[args.length - 1] === true &&
            arg.length > 2 &&
            'function' === typeof args[args.length - 2];
        if (!hasCallback) {
            return new Promise((resolve, reject) => {
                this.sock.send(...args, (err, res) => {
                    if (err) return reject(err);
                    return resolve(res);
                });
            });
        }

       return this.sock.send(...args);
    }

    get type() {
        return 'req';
    }
    get oppo() {
        return 'rep';
    }
};
