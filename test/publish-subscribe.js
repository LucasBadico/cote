import test from 'ava';
import LogSuppress from 'log-suppress';
import async from 'async';
import r from 'randomstring';
import sinon from 'sinon';

const { Publisher, Subscriber } = require('../')();

LogSuppress.init(console);

test('Has no environment', (it) => {
    it.is(Publisher.environment, '');
    it.is(Subscriber.environment, '');
});

test.cb('Supports simple pub&sub', (it) => {
    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: publisher` });
    const subscriber = new Subscriber({ name: `${it.title}: subscriber` });
    const subscriber2 = new Subscriber({ name: `${it.title}: subscriber2` });

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 3] })
    );

    const tester = (done, req) => {
        it.deepEqual(req.args, [1, 2, 3]);
        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(null, done)),
        (_) => {
            [publisher, subscriber, subscriber2].forEach((c) => c.close());

            it.end();
        }
    );
});

test.cb('Supports keys', (it) => {
    const key = r.generate();

    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: keyed publisher`, key });
    const subscriber = new Subscriber({ name: `${it.title}: keyed subscriber`, key });
    const subscriber2 = new Subscriber({ name: `${it.title}: keyed subscriber2`, key });

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 4] })
    );

    const tester = (done, req) => {
        it.deepEqual(req.args, [1, 2, 4]);
        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(null, done)),
        (_) => {
            [publisher, subscriber, subscriber2].forEach((c) => c.close());

            it.end();
        }
    );
});

test.cb('Supports namespaces', (it) => {
    const namespace = r.generate();

    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: ns publisher`, namespace });
    const subscriber = new Subscriber({ name: `${it.title}: ns subscriber`, namespace });
    const subscriber2 = new Subscriber({ name: `${it.title}: ns subscriber2`, namespace });

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => process.nextTick(() => publisher.publish('test', { args: [1, 2, 5] }))
    );

    const tester = (done, req) => {
        it.deepEqual(req.args, [1, 2, 5]);

        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(null, done)),
        (_) => {
            [publisher, subscriber, subscriber2].forEach((c) => c.close());

            it.end();
        }
    );
});

test.cb('Supports keys & namespaces', (it) => {
    const key = r.generate();
    const namespace = r.generate();

    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: kns publisher`, key, namespace });
    const subscriber = new Subscriber({ name: `${it.title}: kns subscriber`, key, namespace });
    const subscriber2 = new Subscriber({ name: `${it.title}: kns subscriber2`, key, namespace });

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 6] })
    );

    const tester = (done, req) => {
        it.deepEqual(req.args, [1, 2, 6]);

        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(null, done)),
        (_) => {
            // [publisher, subscriber, subscriber2].forEach((c) => c.close());

            it.end();
        }
    );
});

test.cb('Publisher throws unknown error', (it) => {
    it.plan(1);

    const key = r.generate();

    const originalListeners = process.listeners('uncaughtException');

    process.removeAllListeners('uncaughtException');

    process.on('uncaughtException', function(err) {
        if (err.message != 'unknown error') {
            originalListeners.forEach((l) => l(err));

            throw err;
        }

        it.pass();
        it.end();
    });

    const publisher = new Publisher({ name: `${it.title}: error throwing publisher`, key });
    publisher.sock.sock.on('bind', () => publisher.sock.sock.server.emit('error', new Error('unknown error')));
});

test.cb('Does not try to reconnect twice to the same publisher', (it) => {
    const key = r.generate();

    const subscriber = new Subscriber({ name: `${it.title}: keyed subscriber`, key });
    const publisher = new Publisher({ name: `${it.title}: keyed publisher`, key });

    publisher.sock.sock.on('connect', () => {
        const stub = sinon.stub(publisher.discovery, 'hello');

        setTimeout(() => {
            stub.restore();

            subscriber.on('cote:added', (obj) => {
                const address = Subscriber.useHostNames ? obj.hostName : obj.address;

                const alreadyConnected = subscriber.sock.sock.socks.some((s) =>
                    (Subscriber.useHostNames ? s._host == obj.hostName : s.remoteAddress == address) &&
                    s.remotePort == obj.advertisement.port);

                it.true(alreadyConnected);
                it.end();
            });
        }, 8000);
    });
});
