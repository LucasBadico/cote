import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';

const environment = r.generate();
const { Requester, Responder } = require('../')({ environment });

LogSuppress.init(console);

test('Instantiate a requester', (it) => {
    const key = r.generate();
    const requester = new Requester({ name: `${it.title}: requester`, key });

    it.is(requester.type, 'req');
});

test.cb('Discover and close a requester', (it) => {
    it.plan(1);

    const key = r.generate();
    const requester = new Requester({ name: `${it.title}: ${key} requester`, key });
    const responder = new Responder({ name: `${it.title}: ${key} responder`, key });

    responder.on('cote:added', () => requester.close());
    responder.on('cote:removed', (obj) => {
        it.is(obj.advertisement.name, `${it.title}: ${key} requester`);

        responder.close();
        it.end();
    });
});
