import multicastDNS from 'multicast-dns';
import { Client, DefaultMediaReceiver } from 'castv2-client';
import googletts from 'google-tts-api';

let language: string;
let deviceAddress: string;
let deviceName: string;
let languageAccent: string = 'us';

export const device = (name: string, lang: string = 'en') => {
  deviceName = name;
  language = lang;
  return this;
};

export const ip = (ip: string, lang: string = 'en') => {
  deviceAddress = ip;
  language = lang;
  return this;
};

// https://cloud.google.com/speech-to-text/docs/languages
export const accent = (accent: string = 'us') => {
  languageAccent = accent;
  return this;
};

const initAddress = () => {
  const mdns = multicastDNS();

  mdns.on('response', (res: any) => {
    console.log('response:', res);
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
      name: '_googlecast._tcp.local',
      type: 'PTR',
    }],
  });
};

const onDeviceUp = (url: string, host: string): Promise<any> => new Promise((resolve, reject) => {
  const client = new Client();

  client.connect(host, () => {
    console.log('connected, launching app ...');

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

      player.on('status', (status: any) => {
        // ????
        console.log('status broadcast playerState=%s', status.playerState);
      });

      player.load(media, { autoplay: true }, (err: any, status: any) => {
        console.log('media loaded playerState=%s', status.playerState);
        // ????
        client.close();
        resolve();
      });
    });
  });

  client.on('error', (err: any) => {
    client.close();
    reject(err);
  });
});

const playSpeech = async (text: string, host: string) => {
  const url = await googletts(text, language, 1);

  await onDeviceUp(host, url);
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
