
/**
 * LIMITATIONS!!!!!!!!!!!!!!!
 * This code assumes there is only one data segment in the provided WAV file.
 */

require('dotenv').config();
const fs = require('fs');
const LOG_LEVEL = process.env.LOG_LEVEL;

// Extract command-line arguments excluding the first two elements (which are 'node' and the script filename)
const arguments = process.argv.slice(2);
const input_filename = arguments[0];
const output_filename = arguments[1];

console.log("Starting: input_filename: " + input_filename + " output_filename = " + output_filename);

const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

function startFileConversion (recognition_results){
    let input_buffer = fs.readFileSync(input_filename);

    input_wav_headers = parseWavHeaders (input_buffer);
    
    console.log(JSON.stringify(input_wav_headers, null, 2));

    let output_buffer = createOutputBuffer (input_wav_headers, input_buffer);

    copyInputToOutput (input_buffer, output_buffer, recognition_results.result.speaker_labels, input_wav_headers);

    // Now copy the outputBuffer to the output file name.
    fs.writeFile(output_filename, output_buffer, (err) => {
        if (err) throw err;
        console.log(output_filename + " has been saved!");
      });
}

function createOutputBuffer(input_wav_headers, input_buffer){

    //  Calculate size of outputBuffer
    let output_buffer_size = input_wav_headers.dataOffset + (2 * input_wav_headers.dataSize);

    let output_buffer = Buffer.alloc (output_buffer_size);

    //  Now copy everything we can into the ouputBuffer except the data.
    input_buffer.copy(output_buffer, 0, 0, input_wav_headers.dataOffset);

    //  Now we need to update a few fields in the outputBuffer
    output_buffer.writeUInt32LE((output_buffer_size - 8), 4);
    
    //  Converts file to two channels.
    output_buffer.writeUInt16LE(2, 22);  

    //  Update the blocAlign for stero
    output_buffer.writeUInt16LE((input_wav_headers.bitsPerSample / 8) * 2, 32);

    //  Update the data subchunk size to be double what was in the mono file.
    output_buffer.writeUInt32LE((2 * input_wav_headers.dataSize), (input_wav_headers.dataOffset - 4));

    //  Now fill the data chunk with silence
    output_buffer.fill ('ff', input_wav_headers.dataOffset, (input_wav_headers.dataOffset + (2 * input_wav_headers.dataSize)), 'hex');

    //  The output buffer is now ready to start stuffing with data.

    return (output_buffer);
}

// Function to parse the WAV file buffer and extract headers
function parseWavHeaders(buffer) {
    const headers = {};
    // Check for RIFF chunk header
    if (buffer.toString('utf8', 0, 4) !== 'RIFF') {
        throw new Error('Invalid WAV file format');
    }
    // Read the total file size
    headers.fileSize = buffer.readUInt32LE(4);

    // Check for WAVE format
    if (buffer.toString('utf8', 8, 12) !== 'WAVE') {
        throw new Error('Invalid WAV file format');
    }
    // Check for fmt chunk header
    if (buffer.toString('utf8', 12, 16) !== 'fmt ') {
        throw new Error('Invalid WAV file format');
    }
    // Read the format chunk size
    headers.fmtChunkSize = buffer.readUInt32LE(16);
    // Read the audio format (PCM should be 1)
    headers.audioFormat = buffer.readUInt16LE(20);
    // Read the number of channels
    headers.numChannels = buffer.readUInt16LE(22);

    if (headers.numChannels != 1) {
        throw new Error('Only single channel files can be converted! Exiting!');
    }

    // Read the sample rate
    headers.sampleRate = buffer.readUInt32LE(24);
    // Read the byte rate
    headers.byteRate = buffer.readUInt32LE(28);
    // Read the block align
    headers.blockAlign = buffer.readUInt16LE(32);
    // Read the bits per sample
    headers.bitsPerSample = buffer.readUInt16LE(34);

    //  Now find the offest to the data chunk
    let offset = 20 + headers.fmtChunkSize;
    while (offset < headers.fileSize)
    {
        if (buffer.toString('utf8', offset, offset + 4) == 'data') {
            // Read the data chunk size
            headers.dataSize = buffer.readUInt32LE(offset + 4);
            headers.dataOffset = offset + 8;
            break        
        }
        else {
            console.log('Non-data subchunk found: type = ' + buffer.toString('utf8', offset, offset + 4) + " size = " + buffer.readUInt32LE(offset + 4));
            offset += 8 + buffer.readUInt32LE(offset + 4);
        }
    }
    
    return headers;
}

//  This function uses the speaker labels to copy data from the input buffer 
//  to the output buffer. The output streams will be interleaved.
function copyInputToOutput (input_buffer, output_buffer, speaker_labels, wav_headers){

    //  Always assume the first speaker is the agent.
    //  The agent samples come first for the interleaved output.
    const agent_label =  speaker_labels[0].speaker;

    const number_of_speaker_events = speaker_labels.length;
    let index = 0;
    let speaker_list = [];
    while (index < number_of_speaker_events){
        let normalized_speaker_label = 1; 
        
        //  Store the speaker label in the list of speakers if its new
        if (!speaker_list.includes(speaker_labels[index].speaker))
            speaker_list.push(speaker_labels[index].speaker);

        //  We will assume that any label other than the second person to speak is the agent
        if (speaker_list.length > 1 && speaker_labels[index].speaker == speaker_list[1])
            normalized_speaker_label = 0;

        // if (speaker_labels[index].speaker != agent_label)
        //     normalized_speaker_label = 1;

        copyData (speaker_labels[index].speaker, normalized_speaker_label, speaker_labels[index].from, speaker_labels[index].to, input_buffer, output_buffer, wav_headers);

        index++;
    }

    console.log("Number of speakers detected: " + speaker_list.length);
}

function copyData(orig_speaker_label, normalized_speaker_label, from_time, to_time, input_buffer, output_buffer, wav_headers){

    input_index = wav_headers.dataOffset + Math.floor(from_time * wav_headers.byteRate);
    output_index = wav_headers.dataOffset + Math.floor(2 * from_time * wav_headers.byteRate);
    samples_to_copy = Math.floor((to_time - from_time) * wav_headers.byteRate);

    //  If this is not the agent copy to the right channel. Agent audio is in the left channel.
    if (normalized_speaker_label == 1)
        output_index += 1

    console.log("copyData: orig_speaker_label = " + orig_speaker_label+ " normalized_speaker_label: " + normalized_speaker_label + " from_time: " + from_time + " input_index: " + input_index + " output_index: " + output_index);

    for (let i = 0; i < samples_to_copy; i++){
        input_buffer.copy(output_buffer, output_index, input_index, input_index + 1);
        input_index += 1;
        output_index += 2;
    }
}

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY,
  }),
  serviceUrl: process.env.WATSON_STT_URL
});

const recognizeParams = {
  audio: fs.createReadStream(input_filename),
  contentType: 'audio/wav',
  model: process.env.WATSON_STT_MODEL,
  speakerLabels: true,
  backgroundAudioSuppression: 0.5,
  speechDetectorSensitivity: 0.4
};

speechToText.recognize(recognizeParams).then(speech_recognition_results => {
    
    // We now have the result. Open the
    console.log(JSON.stringify(speech_recognition_results, null, 2));

    if (speech_recognition_results.result.speaker_labels)
        startFileConversion(speech_recognition_results);
    else
        console.log("ERROR: no speaker_labels returned from Watson STT. Aborting.")

}).catch(err => {
    console.log('error:', err);
});
