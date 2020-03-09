'use strict';

function Curtain_hagl04(sid, ip, hub, model) {
    this.type = model;
    this.sid = sid;
    this.hub = hub;
    this.ip = ip;
    this.className = 'curtain_hagl04';
    this.curtain_level = null;
    this.voltage = null;
    this.percent = null;
}

Curtain_hagl04.prototype.getData = function (data) {
    let newData = false;
    let obj = {};
    if (typeof data.curtain_level !== 'undefined') {
        this.curtain_level = parseFloat(data.curtain_level);
        obj.curtain_level = this.curtain_level;
        newData = true;
    }
    if (data.voltage) {
        data.voltage = parseInt(data.voltage, 10);
        this.voltage = data.voltage / 1000;
        this.percent = Math.round(((data.voltage - 2655) / 5.45) * 10) / 10;
        if (this.percent > 100) {
            this.percent = 100;
        }
        if (this.percent < 0) {
            this.percent = 0;
        }
        obj.voltage = this.voltage;
        obj.percent = this.percent;
        newData = true;
    }
    if (data.status) {
        if (this.status === 'open') {
            obj.open = true;
            newData = true;
        } else
        if (this.status === 'close') {
            obj.close = true;
            newData = true;
        } else
        if (this.status === 'stop') {
            obj.stop = true;
            newData = true;
        } else {
            this.hub.emit('warning', 'Unknown status "' + this.status + '"');
        }
    }

    return newData ? obj : null;
};

Curtain_hagl04.prototype.heartBeat = function (token, data) {
    if (data) {
        const obj = this.getData(data);
        if (obj) {
            this.hub.emit('data', this.sid, this.className, obj);
        }
    }
};

Curtain_hagl04.prototype.Control = function (attr, value) {
    let message;
    if (attr === 'stop' || attr === 'open' || attr === 'close') {
        message = {
            cmd: 'write',
            model: this.type,
            sid: this.sid,
            short_id: 0,
            data: {
                status: attr,
                key: this.hub.getKey(this.ip)
            }
        };
        if (this.hub.protoMajor(this.ip) === '2') {
            message.data["curtain_status"] = attr;
            delete message.data.status;
        }
    } else if (attr === 'curtain_level') {
        message = {
            cmd: 'write',
            model: this.type,
            sid: this.sid,
            short_id: 0,
            data: {
                curtain_level: value.toString(), //Strange thing, working only if string.
                key: this.hub.getKey(this.ip)
            }
        };
        if (this.hub.protoMajor(this.ip) === '2') {
            message.data.curtain_level = value;
        }
    } else {
        this.hub.emit('warning', 'Unknown control attribute "' + attr + '"');
        return;
    }

    this.hub.sendMessage(message, this.ip);
};

Curtain_hagl04.prototype.onMessage = function (message) {
    if (message.data) {
        if (message.data.status) {
            this.on = message.data.status === 'on';
            this.hub.emit('data', this.sid, this.className, {
                state: this.on
            });
        }
        if (typeof message.data.curtain_level !== 'undefined') {
            this.curtain_level = parseFloat(message.data.curtain_level);
            this.hub.emit('data', this.sid, this.className, {
                curtain_level: this.curtain_level
            });
        }
    }
};
module.exports = Curtain_hagl04;