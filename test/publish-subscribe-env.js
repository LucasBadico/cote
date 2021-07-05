import test from 'ava';
import LogSuppress from 'log-suppress';
import async from 'async';
import r from 'randomstring';

const environment = r.generate();
const { Publisher, Subscriber } = require('../')({ environment });

LogSuppress.init(console);

test('Supports environment', (it) => {
    it.is(Publisher.environment, `${environment}:`);
    it.is(Subscriber.environment, `${environment}:`);
});

test.cb('Supports simple pub&sub with env', (it) => {
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

test.cb('Supports keys with env', (it) => {
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

test.cb('Supports namespaces with env', (it) => {
    const namespace = r.generate();

    it.plan(2);

    const publisher = new Publisher({ name: `${it.title}: ns publisher`, namespace });
    const subscriber = new Subscriber({ name: `${it.title}: ns subscriber`, namespace });
    const subscriber2 = new Subscriber({ name: `${it.title}: ns subscriber2`, namespace });

    async.each(
        [subscriber, subscriber2],
        (s, done) => s.sock.sock.on('connect', () => setTimeout(done, 100)),
        (_) => publisher.publish('test', { args: [1, 2, 5] })
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

test.cb('Supports keys & namespaces with env', (it) => {
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
            [publisher, subscriber, subscriber2].forEach((c) => c.close());

            it.end();
        }
    );
});
