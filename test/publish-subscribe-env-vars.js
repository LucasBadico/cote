import test from 'ava';
import LogSuppress from 'log-suppress';
import async from 'async';
import r from 'randomstring';

const environment = r.generate();

process.env.COTE_ENV = environment;
process.env.COTE_USE_HOST_NAMES = true;
process.env.COTE_MULTICAST_ADDRESS = process.env.COTE_MULTICAST_ADDRESS || '239.1.11.111';
process.env.DOCKERCLOUD_IP_ADDRESS = true;

const { Publisher, Subscriber } = require('../');

LogSuppress.init(console);

test('Supports environment', (it) => {
    it.is(Publisher.environment, `${environment}:`);
    it.is(Subscriber.environment, `${environment}:`);
});

test.cb('Supports simple pub&sub with env vars', (it) => {
    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: publisher` });
    const subscriber = new Subscriber({ name: `${it.title}: subscriber` });
    const subscriber2 = new Subscriber({ name: `${it.title}: subscriber2` });

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 3] })
    );

    const tester = function(done, req) {
        it.deepEqual(req.args, [1, 2, 3]);
        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(s, done)),
        (_) => it.end()
    );
});

test.cb('Supports keys with env vars', (it) => {
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

    const tester = function(done, req) {
        it.deepEqual(req.args, [1, 2, 4]);

        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(s, done)),
        (_) => it.end()
    );
});

test.cb('Supports namespaces with env vars', (it) => {
    const namespace = r.generate();

    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: ns publisher`, namespace });
    const subscriber = new Subscriber({ name: `${it.title}: ns subscriber`, namespace });
    const subscriber2 = new Subscriber({ name: `${it.title}: ns subscriber2`, namespace });

    const tester = function(done, req) {
        it.deepEqual(req.args, [1, 2, 5]);

        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 5] })
    );

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(s, done)),
        (_) => it.end()
    );
});

test.cb('Supports keys & namespaces with env vars', (it) => {
    const key = r.generate();
    const namespace = r.generate();

    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: kns publisher`, key, namespace });
    const subscriber = new Subscriber({ name: `${it.title}: kns subscriber`, key, namespace });
    const subscriber2 = new Subscriber({ name: `${it.title}: kns subscriber2`, key, namespace });

    const tester = function(done, req) {
        it.deepEqual(req.args, [1, 2, 6]);

        done();
    };

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.on('test', tester.bind(s, done)),
        (_) => it.end()
    );

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 6] })
    );
});
