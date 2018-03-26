import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';

const environment = r.generate();
const{ Publisher, Subscriber, MonitoringTool } = require('../')({ environment });

LogSuppress.init(console);

test.cb('Monitoring tool pub&sub', (it) => {
    it.plan(4);

    const key = r.generate();

    const publisher = new Publisher({ name: `${t.title}: monitor publisher`, key });
    const subscriber = new Subscriber({ name: `${t.title}: monitor subscriber`, key });

    const monitoringTool = new MonitoringTool();
    const monitoringTool2 = new MonitoringTool();

    let counter = 0;

    monitoringTool.monitor.on('status', (status) => {
        counter++;

        it.is(status.id, subscriber.discovery.me.id);
        it.is(status.nodes[0], publisher.discovery.me.id);

        if (counter == 1) return;

        monitoringTool.monitor.close();
        monitoringTool2.monitor.close();

        const original = subscriber.onMonitorInterval.bind(subscriber);
        subscriber.onMonitorInterval = () => {
            original();
            it.end();
            publisher.close();
            subscriber.close();
        };
    });
});
