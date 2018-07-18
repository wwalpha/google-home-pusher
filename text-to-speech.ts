import * as fs from 'fs';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export const synthesizeSpeech = (text: string, audioEncoding: string = 'MP3', languageCode: string = 'en-US') => new Promise((resolve, reject) => {
  const client = new TextToSpeechClient();

  // Construct the request
  const request = {
    input: { text },
    // Select the language and SSML Voice Gender (optional)
    voice: {
      languageCode,
      ssmlGender: 'NEUTRAL',
    },
    // Select the type of audio encoding
    audioConfig: {
      audioEncoding,
    },
  };

  // Performs the Text-to-Speech request
  client.synthesizeSpeech(request, (err, response) => {
    if (err) {
      reject(err);
      return;
    }

    const fileName = `${new Date().getTime()}.mp3`;
    // Write the binary audio content to a local file
    fs.writeFile(`${new Date().getTime()}.mp3`, response.audioContent, 'binary', (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(fileName);
    });
  });
});
