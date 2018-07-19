import multicastDNS from 'multicast-dns';
import { Client, DefaultMediaReceiver } from 'castv2-client';
import * as googletts from 'google-tts-api';
// const multicastDNS = require('multicast-dns');
// const Client = require('castv2-client').Client;
// const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
// const googletts = require('google-tts-api');

let language: string;
let deviceAddress: string;
let deviceName: string;

export const device = (name: string, lang: string = 'en') => {
  deviceName = name;
  language = lang;
  return this;
};

export const ip = (ip: string, lang: string = 'ja') => {
  deviceAddress = ip;
  language = lang;
  return this;
};

const initAddress = () => {
  const mdns = multicastDNS();

  console.log(mdns);
  mdns.on('response', (res: any, rinfo: any) => {
    console.log('response:', res);
    console.log('rinfo:', rinfo);

    const { additionals = [] } = res;

    const device = additionals.find((item: any) => item.type === 'A' && item.name === `${deviceName}.local`);

    if (device) {
      deviceAddress = device.data;
    } else {
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

const onDeviceUp = (url: string, host: string): Promise<any> => new Promise((resolve, reject) => {
  const client = new Client();

  client.connect(host, () => {
    console.log('connected');
    client.launch(DefaultMediaReceiver, (err: any, player: any) => {
      if (err) {
        reject(err);
        return;
      }

      const media = {
        contentId: url,
        contentType: 'audio/mp3',
        streamType: 'BUFFERED',
      };

      player.load(media, { autoplay: true }, (err: any, status: any) => {
        resolve();
        client.close();
      });
    });
  });

  client.on('error', (err: any) => {
    // console.log('error', err);
    client.close();
    reject(err);
  });
});

const playSpeech = async (text: string, host: string) => {
  const url = await googletts(text, language, 1);

  await onDeviceUp(url, host);
};

/** Play google speech */
export const notify = async (message: string) => {
  if (!deviceAddress) {
    initAddress();
  }

  return await playSpeech(message, deviceAddress);
};

/** Play wave */
export const play = async (mp3Url: string) => {
  if (!deviceAddress) {
    initAddress();
  }

  return await onDeviceUp(mp3Url, deviceAddress);
};
