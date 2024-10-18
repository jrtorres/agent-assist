

let audioContext = null; // Declare audio context variable globally
let socket = null; // Declare WebSocket variable
let fileReader; // Declare FileReader variable
let totalBytesSent = 0; // Track the total number of bytes sent
let totalFileSize = 0; // Track the total size of the file
let fileArrayBuffer; // Used to stream file to server
let wavHeaders;
let intervalId = -1;

// Frame duration if measured in milli-seconds
const frameDuration = 100;

// Function to handle file input change.
function handleFileInputChange(event) {
    console.log('File selected. Reading file...');
    const file = event.target.files[0];

    if (!file) {
        console.error('No file selected.');
        return;
    }

    totalFileSize = file.size; // Set the total file size
    totalBytesSent = 0; // Reset totalBytesSent
    document.getElementById('progressBar').value = 0; //Reset progres bar

    console.log('File size is: ' + totalFileSize);

    // Create a new FileReader
    fileReader = new FileReader();

    // Set up event handlers for the FileReader
    fileReader.onload = function() {
        console.log('File loaded.');
        fileArrayBuffer = this.result;

        console.log('onload: size of buffer: ' + fileArrayBuffer.byteLength);

        //  Make a new copy of the array buffer so that it can be transfered to the audio context
        let audioArrayBuffer = fileArrayBuffer.slice(0);

        wavHeaders = parseWavHeaders(fileArrayBuffer);

        if (wavHeaders.numChannels != 2){
            console.log("Invalid WAV file. WAV file must contain 2 channels of audio. Use the mono-to-stereo converter to convert file to dual channel. Exiting...");
            return;
        }

        // Audio context is needed to playback the wav file
        if (!audioContext) {
            // Create audio context only once
            console.log('Creating audio context...');
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        audioContext.decodeAudioData(audioArrayBuffer, function(audioBuffer) {
            console.log('Audio data decoded. Sample Rate =' + audioBuffer.sampleRate + ' Duration = ' + audioBuffer.duration + ' numberOfChannels = ' + audioBuffer.numberOfChannels);
            setupWebsocket (fileArrayBuffer);

            //  Now play the audio locally
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

        }, function(error) {
            console.error('Error decoding audio file:', error);
        });
    };

    // Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(file);
}

function cleanupSession(){
    if (intervalId != -1){
        clearInterval (intervalId);
        intervalId = -1;
    }

    //  Close the socket
    if (socket) {
        socket.close();
        socket = null;
    }

    if (audioContext != null){
        // Suspend audio processing
        audioContext.suspend();

        // Disconnect nodes
        audioContext.destination.disconnect();

        // Close the AudioContext
        audioContext.close();
        
        audioContext = null;
    }

    totalBytesSent = 0;
    totalFileSize = 0;
}

function setupWebsocket(arrayBuffer){
    if (!socket) {
        // Establish WebSocket connection only once
        console.log('Establishing WebSocket connection...');
        socket = new WebSocket('ws://localhost:8080');
        socket.binaryType = 'arraybuffer';

        // WebSocket event listener for connection open.
        socket.addEventListener('open', function(event) {
            console.log('WebSocket connection established. Sending session open');
            sendSessionOpen();
        });

        socket.addEventListener("message", function(event) {

            message = JSON.parse(event.data);

            if (message.type == "opened"){
                console.log("opened received from server ", event.data);
                // Send audio data in chunks over WebSocket
                sendFileData(arrayBuffer);
            }
            else if (message.type == "disconnect"){
                console.log("disconnect received from server ", event.data);
                cleanupSession();
            }
            else if (message.type == "closed"){
                console.log("closed received from server ", event.data);
                cleanupSession();
            }
            else{
                console.log("Unknown message received from server ", event.data);
            }
          });

        // WebSocket event listener for errors.
        socket.addEventListener('error', function(event) {
            console.error('WebSocket error:', event);
            socket = null;
            cleanupSession();
        });

        // WebSocket event listener for connection close.
        socket.addEventListener('close', function(event) {
            console.log('WebSocket connection closed.');
            socket = null;
            cleanupSession();
        });
    } else {
        // Send audio data in chunks over existing WebSocket connection
        console.log('Error!! Websocket should not be open here.');
    }
}

function sendSessionOpen(){
    //  Currently this message assume a dual-chanel WAV file
    //  Note that a random ANI is generated.
    const openMessage = {
                            "version": "2",
                            "type": "open",
                            "seq": 1,
                            "serverseq": 0,
                            "id": crypto.randomUUID(),
                            "position": "PT0S",
                            "parameters": {
                                "organizationId": crypto.randomUUID(),
                                "conversationId": crypto.randomUUID(),
                                "participant": {
                                    "id": crypto.randomUUID(),
                                    "ani": "+1" + Math.floor(1000000000 + Math.random() *8999999999),
                                    "aniName": "WAV File",
                                    "dnis": "+18006558977"
                                },
                                "media": [
                                    {
                                    "type": "audio",
                                    "format": "ulaw",
                                    "channels": ["external", "internal" ],
                                    "rate": 8000
                                    }
                                ],
                                "language": "en-US"
                            }
                        };

    socket.send(JSON.stringify(openMessage));
}

// Function to send audio data to the WebSocket in chunks.
function sendFileData(arrayBuffer) {
    console.log('sendFileData: arrayBuffer byteLength = ' + arrayBuffer.byteLength);

    //  First determine the frameSize from the frameDuration. This will dictate how much data is sent on each interval
    frameSize = (wavHeaders.sampleRate * (wavHeaders.bitsPerSample / 8)) * (frameDuration / 1000);
    console.log('sendFileData: frameDuration = ' + frameDuration + ' frameSize = ' + frameSize);

    //  Point the byteCounter at the start of the data segment
    let byteCounter = wavHeaders.dataOffset;
    let duration = 0;

    const sendChunk = () => {
        if (byteCounter >= arrayBuffer.byteLength){
            console.log('File read and streamed completely. Closing WebSocket connection. totleBytesSent = ' + arrayBuffer.byteLength);
            cleanupSession();
            return;
        }

        const start = byteCounter;
        const end = Math.min(arrayBuffer.byteLength, start + (2 *frameSize));
        const chunk = arrayBuffer.slice(start, end);

        // Send the chunk
        socket.send(chunk);

        byteCounter += chunk.byteLength;
        duration += frameDuration;

        // Update progress bar after sending each chunk
        const progress = (byteCounter / arrayBuffer.byteLength) * 100;
        document.getElementById('progressBar').value = progress;

        // console.log('sendFileData: chunk send: byteCounter = ' + byteCounter + ' duration = ' + duration);
   };

   //   This causes each data frame to be clocked out at the correct interval
   intervalId = setInterval(sendChunk, frameDuration);
}

//  audioFormat – Indicates how the sample data for the wave file is stored. 
//  The most common format tag is 1, for integer PCM. Other formats include 
//  floating point PCM (3), ADPCM (2), A-law (6), μ-law (7)
function parseWavHeaders(buffer) {
    wavHeaders = {};
    const view = new DataView(buffer);
    
    // RIFF header
    if (String.fromCharCode(view.getUint8(0)) + 
        String.fromCharCode(view.getUint8(1)) +
        String.fromCharCode(view.getUint8(2)) +
        String.fromCharCode(view.getUint8(3)) !== 'RIFF') {
        throw new Error('Invalid WAV file format');
    }

    wavHeaders.fileSize = view.getUint32(4, true); // little-endian

    // WAV header
    if (String.fromCharCode(view.getUint8(8)) +
        String.fromCharCode(view.getUint8(9)) +
        String.fromCharCode(view.getUint8(10)) +
        String.fromCharCode(view.getUint8(11)) !== 'WAVE') {
        throw new Error('Invalid WAV file format');
    }

    // Format chunk
    if (String.fromCharCode(view.getUint8(12)) +
        String.fromCharCode(view.getUint8(13)) +
        String.fromCharCode(view.getUint8(14)) +
        String.fromCharCode(view.getUint8(15)) !== 'fmt ') {
        throw new Error('Invalid WAV file format');
    }

    wavHeaders.formatChunkSize = view.getUint32(16, true);
    wavHeaders.audioFormat = view.getUint16(20, true);
    wavHeaders.numChannels = view.getUint16(22, true);
    wavHeaders.sampleRate = view.getUint32(24, true);
    wavHeaders.byteRate = view.getUint32(28, true);
    wavHeaders.blockAlign = view.getUint16(32, true);
    wavHeaders.bitsPerSample = view.getUint16(34, true);

    let offset = 20 + wavHeaders.formatChunkSize;
    while (offset < wavHeaders.fileSize)
    {
        if (String.fromCharCode(view.getUint8(offset)) +
            String.fromCharCode(view.getUint8(offset + 1)) +
            String.fromCharCode(view.getUint8(offset + 2)) +
            String.fromCharCode(view.getUint8(offset + 3)) == 'data') {
                wavHeaders.dataSize = view.getUint32(offset + 4, true);
                wavHeaders.dataOffset = offset + 8;
                break;
        }
        else{
            console.log('Non-data subchunk found: type = ' + 
                            String.fromCharCode(view.getUint8(offset)) +
                            String.fromCharCode(view.getUint8(offset + 1)) +
                            String.fromCharCode(view.getUint8(offset + 2)) +
                            String.fromCharCode(view.getUint8(offset + 3)) + " size = " + view.getUint32(offset + 4, true));
            
            offset += 8 + view.getUint32(offset + 4, true);        
        }
    }

    console.log('WAV Headers: fileSize =' + wavHeaders.fileSize);
    console.log('WAV Headers: audioFormat =' + wavHeaders.audioFormat);
    console.log('WAV Headers: numChannels =' + wavHeaders.numChannels);
    console.log('WAV Headers: sampleRate =' + wavHeaders.sampleRate);
    console.log('WAV Headers: byteRate =' + wavHeaders.byteRate);
    console.log('WAV Headers: blockAlign =' + wavHeaders.blockAlign);
    console.log('WAV Headers: bitsPerSample =' + wavHeaders.bitsPerSample);
    console.log('WAV Headers: dataSize =' + wavHeaders.dataSize);
    console.log('WAV Headers: dataOffset =' + wavHeaders.dataOffset);

    return wavHeaders;
}

// Event listener for file input change.
document.getElementById('fileInput').addEventListener('change', handleFileInputChange);
