import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';

const environment = r.generate();
const { Requester, Responder } = require('../')({ environment });

LogSuppress.init(console);

test('Supports environment', (it) => {
    it.is(Requester.environment, `${environment}:`);
    it.is(Responder.environment, `${environment}:`);
});

test.cb('Supports simple req&res', (it) => {
    it.plan(1);

    const requester = new Requester({ name: `${it.title}: simple requester` });
    const responder = new Responder({ name: `${it.title}: simple responder` });

    requester.send({ type: 'test', args: [1, 2, 3] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 3]);
        it.end();
    });
});

test.cb('Supports keys', (it) => {
    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: keyed requester`, key });
    const responder = new Responder({ name: `${it.title}: keyed responder`, key });

    requester.send({ type: 'test', args: [1, 2, 4] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 4]);
        it.end();
    });
});

test.cb('Supports namespaces', (it) => {
    const namespace = r.generate();

    const requester = new Requester({ name: `${it.title}: ns requester`, namespace });
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

    const requester = new Requester({ name: `RRE ${it.title}: kns requester`, key, namespace });
    const responder = new Responder({ name: `RRE ${it.title}: kns responder`, key, namespace });

    requester.send({ type: 'test', args: [1, 2, 6] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 6]);
        it.end();
    });
});
