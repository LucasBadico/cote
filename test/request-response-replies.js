import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';

const environment = r.generate();
const { Requester, Responder } = require('../')({ environment });

LogSuppress.init(console);

test.cb('Supports req&res callback', (it) => {
    it.plan(1);
    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: cb requester`, key });
    const responder = new Responder({ name: `${it.title}: cb responder`, key });

    requester.send({ type: 'test', args: [1, 2, 3] }, (err, res) => {
        if (err) it.fail(err, `shouldn't produce error`);

        it.deepEqual(res, [1, 2, 3]);

        it.end();
    });

    responder.on('test', (req, cb) => cb(null, req.args));
});

test('Supports req&res promises success', (it) => {
    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: promise requester`, key });
    const responder = new Responder({ name: `${it.title}: promise responder`, key });

    responder.on('test', (req) => Promise.resolve(req.args));

    return requester.send({ type: 'test', args: [1, 2, 4] })
        .then((res) => it.deepEqual(res, [1, 2, 4]));
});

test('Supports req&res promises fail', (it) => {
    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: promise requester`, key });
    const responder = new Responder({ name: `${it.title}: promise responder`, key });

    responder.on('test', (req) => Promise.reject(req.args));

    return requester.send({ type: 'test', args: [1, 2, 5] })
        .catch((err) => it.deepEqual(err, [1, 2, 5]));
});
