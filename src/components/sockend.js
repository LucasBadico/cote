const EventEmitter = require('eventemitter2').EventEmitter2;
const util = require('util');
const Discovery = require('./discovery');
const axon = require('@dashersw/axon');
const Subscriber = require('./subscriber');
const Requester = require('./requester');
const Configurable = require('./configurable');
const Component = require('./component');

module.exports = class Sockend extends Configurable(Component) {
    constructor(io, advertisement, discoveryOptions) {
        const originalKey = advertisement.key;
        super(advertisement, discoveryOptions);

        this.requesterTransformators = [];

        this.startDiscovery();

        const namespaces = {};

        this.discovery.on('added', (obj) => {
            if (obj.advertisement.axon_type != 'rep') return;
            if (obj.advertisement.key != this.advertisement.key) return;
            if (!Array.isArray(obj.advertisement.respondsTo)) return;

            const namespace = obj.advertisement.namespace;
            const normalizedNamespace = namespace || '';

            if (namespaces['/' + normalizedNamespace]) return;

            namespaces['/' + normalizedNamespace] = true;
            obj.namespace = namespace;

            const requester = new Requester({
                name: 'sockendReq',
                namespace,
                key: originalKey,
            }, discoveryOptions);
            obj.requester = requester;

            const originalRequestOnAdded = requester.onAdded.bind(requester);
            requester.onAdded = (obj) => {
                if (!Array.isArray(obj.advertisement.respondsTo)) return;
                originalRequestOnAdded(obj);
            };

            obj.requesterSocketHandler = (socket) => {
                obj.advertisement.respondsTo.forEach((topic) => {
                    socket.on(topic, (data, ...args) => { // change this also
                        // topic as type on first argument

                        // if last argument as true
                        const hasCallback = 
                            'boolean' === typeof args[args.length - 1] &&
                            args[args.length - 1] === true &&
                            arg.length > 1  &&
                            'function' === typeof args[args.length - 2];

                        if (args.length === 0 && typeof data === 'function') {
                            return requester.send({type: topic}, args[0], true);
                        }

                        this.requesterTransformators.forEach((transFn) => transFn(data, socket));

                        requester.send({...data, type: topic }, ...args);
                    });
                });
            };

            let server = io.of('/');
            if (namespace) server = io.of('/' + namespace);
            server.on('connection', obj.requesterSocketHandler);

            for (let sId in server.sockets) {
                obj.requesterSocketHandler(server.sockets[sId]);
            }
        });

        const publisherNamespaces = {};

        this.discovery.on('added', (obj) => {
            if (obj.advertisement.axon_type != 'pub-emitter') return;
            if (obj.advertisement.key != this.advertisement.key) return;

            const namespace = obj.advertisement.namespace;
            const normalizedNamespace = namespace || '';

            if (publisherNamespaces['/' + normalizedNamespace]) return;

            publisherNamespaces['/' + normalizedNamespace] = true;
            obj.namespace = namespace;

            const subscriber = new Subscriber({
                name: 'sockendSub',
                namespace: namespace,
                key: originalKey,
                subscribesTo: obj.advertisement.broadcasts,
            }, discoveryOptions);

            subscriber.onMonitorAdded = () => { };

            obj.subscriber = subscriber;

            subscriber.on('**', function(data) {
                if (this.event == 'cote:added' || this.event == 'cote:removed') return;

                let topic = this.event.split('::');
                let namespace = '';

                if (topic.length > 1) {
                    namespace += '/' + topic[0];
                    topic = topic.slice(1);
                }

                topic = topic.join('');

                io.of(namespace).emit(topic, data);
            });
        });
    };

    get type() {
        return 'sockend';
    }
};
