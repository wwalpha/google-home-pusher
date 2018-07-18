const multicastDNS = require('multicast-dns');

const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

let deviceAddress: string;
let language: string;
let deviceName: string;

const getPlayUrl = (url: string, host: string, callback: any) => {
  onDeviceUp(host, url, (res: any) => {
    callback(res);
  });
};

export const device = (name: string, lang: string = 'jp') => {
  deviceName = name;
  language = lang;
  return this;
};

export const ip = (ip: string, lang: string = 'jp') => {
  deviceAddress = ip;
  return this;
};

const googletts = require('google-tts-api');
let googlettsaccent = 'us';
// 國語 (台灣)	cmn-Hant-TW	Chinese, Mandarin (Traditional, Taiwan)
// 廣東話 (香港)	yue-Hant-HK	Chinese, Cantonese (Traditional, Hong Kong)
// 日本語（日本）	ja-JP	Japanese (Japan)
// 普通話 (香港)	cmn-Hans-HK	Chinese, Mandarin (Simplified, Hong Kong)
// 普通话 (中国大陆)	cmn-Hans-CN	Chinese, Mandarin (Simplified, China)
const accent = (accent: string) => {
  googlettsaccent = accent;
  return this;
};

const notify = (message: string, callback: any) => {
  if (!deviceAddress) {
    const mdns = multicastDNS();
    mdns.on('response', (service: any) => {
      console.log('Device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.name.includes(deviceName.replace(' ', '-'))) {
        deviceAddress = service.addresses[0];
        getSpeechUrl(message, deviceAddress, (res: any) => {
          callback(res);
        });
      }
      mdns.destroy();
    });
  } else {
    getSpeechUrl(message, deviceAddress, (res: any) => {
      callback(res);
    });
  }
};

const play = (mp3Url: string, callback: any) => {
  if (!deviceAddress) {
    const mdns = multicastDNS();
    mdns.on('response', (service: any) => {
      console.log('Device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.name.includes(deviceName.replace(' ', '-'))) {
        deviceAddress = service.addresses[0];
        getPlayUrl(mp3Url, deviceAddress, (res: any) => {
          callback(res);
        });
      }
      mdns.destroy();
    });
  } else {
    getPlayUrl(mp3Url, deviceAddress, (res: any) => {
      callback(res);
    });
  }
};

const getSpeechUrl = (text: string, host: string, callback: any) => {
  googletts(text, language, 1).then((url: string) => {
    onDeviceUp(host, url, (res: any) => {
      callback(res);
    });
  }).catch((err: any) => {
    console.error(err.stack);
  });
};



export const onDeviceUp = (host: string, url: string, callback: any) => {
  const client = new Client();
  client.connect(host, () => {
    client.launch(DefaultMediaReceiver, (err: any, player: any) => {

      const media = {
        contentId: url,
        contentType: 'audio/mp3',
        streamType: 'BUFFERED', // or LIVE
      };
      player.load(media, { autoplay: true }, (err: any, status: any) => {
        client.close();
        callback('Device notified');
      });
    });
  });

  client.on('error', (err: any) => {
    console.log('Error: %s', err.message);
    client.close();
    callback('error');
  });
};

// exports.ip = ip;
// exports.device = device;
// exports.accent = accent;
// exports.notify = notify;
// exports.play = play;
