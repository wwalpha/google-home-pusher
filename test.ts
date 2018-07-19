import * as home from './google-home-pusher';

// home.ip('172.168.80.3', 'ja');

home.onDeviceUp('https://s3-ap-northeast-1.amazonaws.com/iotmobile-userfiles-mobilehub-1316078810/public/20180717141004107.wav', '172.168.80.3');
process.on('unhandledRejection', console.dir);
