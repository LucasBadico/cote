import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';
import async from 'async';

const environment = r.generate();
const { TimeBalancedRequester, Responder } = require('../')({ environment });

LogSuppress.init(console);

test('Supports environment', (it) => {
    it.is(TimeBalancedRequester.environment, `${environment}:`);
    it.is(Responder.environment, `${environment}:`);
});

test.cb('Supports simple req&res', (it) => {
    it.plan(1);

    const requester = new TimeBalancedRequester({ name: `${it.title}: simple requester` });
    const responder = new Responder({ name: `${it.title}: simple responder` });

    requester.send({ type: 'test', args: [1, 2, 3] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 3]);
        it.end();
    });
});

test.cb('Supports keys & namespaces', (it) => {
    const key = r.generate();
    const namespace = r.generate();

    const requester = new TimeBalancedRequester({ name: `TBR ${it.title}: kns requester`, key, namespace });
    const responder = new Responder({ name: `TBR ${it.title}: kns responder`, key, namespace });

    requester.send({ type: 'test', args: [1, 2, 6] });

    responder.on('test', (req) => {
        responder.close();
        requester.close();
        it.deepEqual(req.args, [1, 2, 6]);
        it.end();
    });
});

