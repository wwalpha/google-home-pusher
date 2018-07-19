"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const multicast_dns_1 = require("multicast-dns");
const castv2_client_1 = require("castv2-client");
const googletts = require("google-tts-api");
let language;
let deviceAddress;
let deviceName;
exports.device = (name, lang = 'en') => {
    deviceName = name;
    language = lang;
    return this;
};
exports.ip = (ip, lang = 'ja') => {
    deviceAddress = ip;
    language = lang;
    return this;
};
const initAddress = () => {
    const mdns = multicast_dns_1.default();
    console.log(mdns);
    mdns.on('response', (res, rinfo) => {
        console.log('response:', res);
        console.log('rinfo:', rinfo);
        const { additionals = [] } = res;
        const device = additionals.find((item) => item.type === 'A' && item.name === `${deviceName}.local`);
        if (device) {
            deviceAddress = device.data;
        }
        else {
            console.log('Can not find any device by given name.');
        }
        mdns.destroy();
    });
    mdns.query({
        questions: [{
                name: '_googlecast._tcp',
                type: 'PTR',
                class: 'IN',
            }],
    });
};
const onDeviceUp = (url, host) => new Promise((resolve, reject) => {
    const client = new castv2_client_1.Client();
    client.connect(host, () => {
        console.log('connected');
        client.launch(castv2_client_1.DefaultMediaReceiver, (err, player) => {
            if (err) {
                reject(err);
                return;
            }
            const media = {
                contentId: url,
                contentType: 'audio/mp3',
                streamType: 'BUFFERED',
            };
            player.load(media, { autoplay: true }, (err, status) => {
                resolve();
                client.close();
            });
        });
    });
    client.on('error', (err) => {
        client.close();
        reject(err);
    });
});
const playSpeech = (text, host) => __awaiter(this, void 0, void 0, function* () {
    const url = yield googletts(text, language, 1);
    yield onDeviceUp(url, host);
});
exports.notify = (message) => __awaiter(this, void 0, void 0, function* () {
    if (!deviceAddress) {
        initAddress();
    }
    return yield playSpeech(message, deviceAddress);
});
exports.play = (mp3Url) => __awaiter(this, void 0, void 0, function* () {
    if (!deviceAddress) {
        initAddress();
    }
    return yield onDeviceUp(mp3Url, deviceAddress);
});
