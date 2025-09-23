

let audioContext = null; // Declare audio context variable globally
let socket = null; // Declare WebSocket variable
let totalBytesSent = 0; // Track the total number of bytes sent
let totalFileSize = 0; // Track the total size of the file
let fileArrayBuffer; // Used to stream file to server
let wavHeaders;
let intervalId = -1;
let websocket_url;
let sendChunkFunc;

// Frame duration if measured in milli-seconds
const frameDuration = 100;

const uuid41 = () => ('xxxxxxxx-xxxx-4xxx-Nxxx-xxxxxxxxxxxx'
  .replace(/x/g, () =>  ((Math.random()*16)|0).toString(16))
  .replace(/N/g, () => ((Math.random()*4)|0 + 8).toString(16)));

// Function to handle file input change.
export function send(arrayBuffer, agent_id=uuid41(), url = 'ws://localhost:8080') {

    //  First we cleanup in currently running sessions
    cleanupSession();

    websocket_url = url;
    fileArrayBuffer = arrayBuffer;

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
        setupWebsocket (fileArrayBuffer, agent_id=agent_id);

        //  Now play the audio locally
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

    }, function(error) {
        console.error('Error decoding audio file:', error);
    });
}

export function togglePauseResume() {
    if (audioContext != null){
        if (audioContext.state === 'running') {
            console.log("togglePauseResume: suspending");
            audioContext.suspend();

            //  This code stops the sending of data over the websocket
            clearInterval (intervalId);
            intervalId = -1;
        } else if (audioContext.state === 'suspended') {
            console.log("togglePauseResume: reuming");
            audioContext.resume();

            //  This code resumes sending of data over the websocket
            intervalId = setInterval(sendChunkFunc, frameDuration);
        }
    }
}

export function cancel() {
    cleanupSession();
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

function setupWebsocket(arrayBuffer, agent_id=""){
    if (!socket) {
        // Establish WebSocket connection only once
        console.log('Establishing WebSocket connection...');
        socket = new WebSocket(websocket_url);

        // WebSocket event listener for connection open.
        socket.addEventListener('open', function(event) {
            console.log('WebSocket connection established. Sending session open');
            sendSessionOpen(agent_id);
        });

        socket.addEventListener("message", function(event) {

            let message = JSON.parse(event.data);

            if (message.type == "opened"){
                console.log("opened received from server ", event.data);
                // Send audio data in chunks over WebSocket
                sendChunkFunc = sendFileData(arrayBuffer);
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

function sendSessionOpen(agent_id){
    //  Currently this message assume a dual-chanel WAV file
    //  Note that a random ANI is generated.
    const openMessage = {
                            "version": "2",
                            "type": "open",
                            "seq": 1,
                            "serverseq": 0,
                            "id": uuid41(),//crypto.randomUUID(),
                            "position": "PT0S",
                            "agent_id": agent_id, // this is a placeholder for agent_id, for backends to route communications
                            "parameters": {
                                "organizationId": uuid41(), //crypto.randomUUID(),
                                "conversationId": uuid41(), //crypto.randomUUID(),
                                "participant": {
                                    "id": uuid41(), //crypto.randomUUID(),
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
    let frameSize = (wavHeaders.sampleRate * (wavHeaders.bitsPerSample / 8)) * (frameDuration / 1000);
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

   return sendChunk;
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

