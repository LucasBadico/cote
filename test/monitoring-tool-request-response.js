import test from 'ava';
import LogSuppress from 'log-suppress';
import r from 'randomstring';
import request from 'request';
import fs from 'fs';
import sinon from 'sinon';
import childProcess from 'child_process';

const environment = r.generate();
const { Requester, Responder, MonitoringTool } = require('../')({
    environment, useHostNames: true, statusInterval: 300,
});

LogSuppress.init(console);

test.cb('Discover req&res', (it) => {
    it.plan(4);

    const key = r.generate();

    const requester = new Requester({ name: `${it.title}: monitor requester`, key });
    const responder = new Responder({ name: `${it.title}: monitor responder`, key });

    const monitoringTool = new MonitoringTool();
    const monitoringTool2 = new MonitoringTool();

    let counter = 0;

    monitoringTool.monitor.on('status', (status) => {
        counter++;

        it.is(status.id, requester.discovery.me.id);
        it.is(status.nodes[0], responder.discovery.me.id);

        if (counter == 1) return;

        monitoringTool.monitor.close();
        monitoringTool2.monitor.close();

        const original = requester.onMonitorInterval.bind(requester);
        requester.onMonitorInterval = () => {
            original();
            it.end();
        };
    });
});

test.serial.cb('Render index.html', (it) => {
    const monitoringTool = new MonitoringTool();

    monitoringTool.server.on('listening', (s) => {
        const { address, port } = monitoringTool.server.address();
        setTimeout(() => {
            request.get(`http://${address}:${port}`, (err, response, body) => {
                it.is(body, fs.readFileSync('./src/monitoring-tool/frontend/index.html', 'utf8'));
                it.end();
            });
        }, 1000);
    });
});

test.serial.cb('Cannot render index.html', (it) => {
    const monitoringTool = new MonitoringTool();

    monitoringTool.server.on('listening', (s) => {
        const { address, port } = monitoringTool.server.address();

        const stub = sinon.stub(fs, 'readFile').callsFake((filename, cb) => cb('error!'));

        request.get(`http://${address}:${port}`, (err, response, body) => {
            it.is(response.statusCode, 500);
            it.is(body, 'Error loading index.html');

            stub.restore();
            it.end();
        });
    });
});

test.serial.cb('Receive status from another process', (it) => {
    const monitoringTool = new MonitoringTool();

    monitoringTool.monitor.on('status', () => p1.kill() && p2.kill() && it.end());

    const p1 = childProcess.fork('./examples/requester.js', { env: { COTE_ENV: environment }, silent: true });
    const p2 = childProcess.fork('./examples/responder.js', { env: { COTE_ENV: environment }, silent: true });
});

test.serial.cb('Server throws unknown error', (it) => {
    it.plan(1);

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

    const monitoringTool = new MonitoringTool();
    monitoringTool.server.on('listening', () => monitoringTool.server.emit('error', new Error('unknown error')));
});
