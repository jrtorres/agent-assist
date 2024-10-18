
const fs = require('fs');

// Extract command-line arguments excluding the first two elements (which are 'node' and the script filename)
const arguments = process.argv.slice(2);
const input_filename = arguments[0];

function startFileAnalysis (){
    let input_buffer = fs.readFileSync(input_filename);

    input_wav_headers = parseWavHeaders (input_buffer);
    
    console.log(JSON.stringify(input_wav_headers, null, 2));

    console.log("Data length: " + input_wav_headers.fileSize);

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

startFileAnalysis();
