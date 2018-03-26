import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';
import async from 'async';

const environment = r.generate();
const { PendingBalancedRequester, Responder } = require('../')({ environment });

LogSuppress.init(console);

test('Supports environment', (it) => {
    it.is(PendingBalancedRequester.environment, `${environment}:`);
    it.is(Responder.environment, `${environment}:`);
});

test.cb('Supports simple req&res', (it) => {
    it.plan(1);

    const requester = new PendingBalancedRequester({ name: `${it.title}: simple requester` });
    const responder = new Responder({ name: `${it.title}: simple responder` });

    requester.send({ type: 'test', args: [1, 2, 3] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 3]);
        it.end();
    });
});

test.cb('Supports keys', (it) => {
    const key = r.generate();

    const requester = new PendingBalancedRequester({ name: `${it.title}: keyed requester`, key });
    const responder = new Responder({ name: `${it.title}: keyed responder`, key });

    requester.send({ type: 'test', args: [1, 2, 4] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 4]);
        it.end();
    });
});

test.cb('Supports namespaces', (it) => {
    const namespace = r.generate();

    const requester = new PendingBalancedRequester({ name: `${it.title}: ns requester`, namespace });
    const responder = new Responder({ name: `${it.title}: ns responder`, namespace });

    requester.send({ type: 'test', args: [1, 2, 5] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 5]);
        it.end();
    });
});

test.cb('Supports keys & namespaces', (it) => {
    const key = r.generate();
    const namespace = r.generate();

    const requester = new PendingBalancedRequester({ name: `PBR ${it.title}: kns requester`, key, namespace });
    const responder = new Responder({ name: `PBR ${it.title}: kns responder`, key, namespace });

    requester.send({ type: 'test', args: [1, 2, 6] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 6]);
        it.end();
    });
});

test.cb('Supports request balancing', (it) => {
    const key = r.generate();
    const namespace = r.generate();

    it.plan(30);

    const requester = new PendingBalancedRequester({ name: `PBR ${it.title}: kns requester`, key, namespace });
    const responder = new Responder({ name: `PBR ${it.title}: kns responder`, key, namespace });
    const responder2 = new Responder({ name: `PBR ${it.title}: kns responder 2`, key, namespace });
    const responder3 = new Responder({ name: `PBR ${it.title}: kns responder 3`, key, namespace });

    const responders = [responder, responder2, responder3];

    responders.forEach((r) => r.on('test', (req, cb) => {
        setTimeout(() => cb(req.args), Math.random() * 1000 + 50);
    }));

    async.timesLimit(30, 5,
        (time, done) => {
            requester.send({ type: 'test', args: [3, 2, time] }, (res) => {
                it.deepEqual(res, [3, 2, time]);

                done();
            });
        },
        (err, results) => {
            it.end();
        });
});
