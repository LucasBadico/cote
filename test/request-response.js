import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';
import sinon from 'sinon';

const { Requester, Responder } = require('../')();

LogSuppress.init(console);

test('Has no environment', (it) => {
    it.is(Requester.environment, '');
    it.is(Responder.environment, '');
});

test.cb(`Ignore messages that don't include type`, (it) => {
    it.plan(1);

    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: ignore requester`, key });
    const responder = new Responder({ name: `${it.title}: ignore responder`, key });

    requester.send('This should be ignored');

    responder.sock.on('message', (req) => {
        it.falsy(req.type);
        it.end();
    });
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

    const requester = new Requester({ name: `RR ${it.title}: kns requester`, key, namespace });
    const responder = new Responder({ name: `RR ${it.title}: kns responder`, key, namespace });

    requester.send({ type: 'test', args: [1, 2, 6] });

    responder.on('test', (req) => {
        it.deepEqual(req.args, [1, 2, 6]);
        it.end();
    });
});

test.cb('Responder throws unknown error', (it) => {
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

    const responder = new Responder({ name: `${it.title}: error throwing responder`, key });
    responder.sock.on('bind', () => responder.sock.server.emit('error', new Error('unknown error')));
});

test.cb('Does not try to reconnect twice to the same responder', (it) => {
    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: keyed requester`, key });
    const responder = new Responder({ name: `${it.title}: keyed responder`, key });

    responder.sock.on('connect', () => {
        const stub = sinon.stub(responder.discovery, 'hello');

        setTimeout(() => {
            stub.restore();

            requester.on('cote:added', (obj) => {
                const address = Requester.useHostNames ? obj.hostName : obj.address;

                const alreadyConnected = requester.sock.socks.some((s) =>
                    (Requester.useHostNames ? s._host == obj.hostName : s.remoteAddress == address) &&
                    s.remotePort == obj.advertisement.port);

                it.true(alreadyConnected);
                it.end();
            });
        }, 8000);
    });
});
