# Mono-to-Stereo WAV Converter

This project folder contains functions for operating on WAV files. It's primarily used to convert a single channel WAV file that contains mixed audio from both a caller and an agent into a dual channel WAV file with the two call participants split into left and right channels. The first speaker detected is always put into the left channel and the second speaker detected is always put into the right channel. 

Note that Watson STT is used to derive the speaker lables.

## Requirements
- NodeJS v16 and higher. Go [here](https://nodejs.org/en/download/).
- A Waton STT instance is required to perform the transcriptions. Go [here](https://cloud.ibm.com/docs/speech-to-text?topic=speech-to-text-gettingStarted) to get started.
- The file being converted MUST be in the following format: WAV, mono, ulaw, 8 kHz (go [here](https://www.audacityteam.org/) if you need open source to convert the WAV file to this format)

## How to run
1. First you'll need to install a recent version of Node.js
2. Move the .env-example to .env and fill in the Watson STT related environment variables.
3. Run the converter using the following command:

```
node main.js path-to-input.wav path-to-output.wav
```

If you wish to just view the WAV headers you can run this command without setting up the .env file:
```
node wav_header_dump.js path-to-input.wav
```

## Limitations
If more than two speakers are detected, any speaker label greater than 1 is assumed to be the same speaker that is labeled 1.

