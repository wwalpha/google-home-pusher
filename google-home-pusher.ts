const multicastDNS = require('multicast-dns');
const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const googletts = require('google-tts-api');

let language: string;
let deviceAddress: string;
let deviceName: string;

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

export const initAddress = () => {
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

  mdns.on('query', (packet: any, rinfo: any) => {
    console.log('on query');
    console.log(packet);
    console.log(rinfo);
  });
  console.log('start query');
  // mdns.query({
  //   questions: [],
  // });
  // mdns.query();
  mdns.query({
    questions: [{
      name: '_googlezone._tcp.local',
      type: 'PTR',
      class: 'IN',
    }],
  });
  console.log('end query');
};

export const onDeviceUp = (url: string, host: string): Promise<any> => new Promise((resolve, reject) => {
  const client = new Client();

  console.log(client);
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
    console.log('error', err);
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
