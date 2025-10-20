// const { startSpan, endSpan } = require('./spanUtils');
// const {parentSpan} = require('./wsSpan')
const { trace, SpanKind, context } = require('@opentelemetry/api');
const tracer = trace.getTracer('GenesysAudioHookAdapter');
const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;
const url = require('url');

// Change to your own Speech To Text Engine implementation, can use WatsonSpeechToTextEngine.js for guidance
const SpeechToTextEngine = require('./WatsonSpeechToTextEngine');
const StreamingSessionState = require('./GenesysStreamingSessionState');

const DEFAULT_PORT = process.env.DEFAULT_AUDIO_HOOK_LISTEN_PORT;
const LOG_LEVEL = process.env.LOG_LEVEL;
const logger = require('pino')({ level: LOG_LEVEL, name: 'GenesysAudioHookAdapterV2' });

const rootTopic = "agent-assist/";
const rootSessionTopic = rootTopic + "session";

var eventPublisher = null;
function setEventPublisher(publisher) { eventPublisher = publisher; }
module.exports.setEventPublisher = setEventPublisher;

/**
 * Function for sending an 'opened" response on websocket. Also starts a span and sends a session_started event to event listeners.
 *
 * @param {*} webSocket
 * @param {*} openRequest
 * @param {*} sessionState
 */
function sendOpenedResponse(webSocket, message, sessionState, parentSpanCtx) {
  logger.info('Send opened response message.');

  let event = {
    'type': 'session_started',
    'parameters': {
      'session_id': sessionState.conversationId,
      'customer_ani': sessionState.participant.ani,
      'customer_name': sessionState.participant.aniName,
      'dnis': sessionState.participant.dnis,
      'conversationid': sessionState.conversationId, 
      'conversationStartTime': sessionState.conversationStartTime,
      'conversationEndTime': sessionState.conversationStartTime,
    },
    'agent_id': sessionState.agent_id // this is a temporary parameter for routing backend messages
  };

  // this might need to be re-worked at some point because the topic doesn't include the conversationId
  tracer.startActiveSpan('eventPublisher.publishMessage',{kind: SpanKind.INTERNAL}, parentSpanCtx, (span) => {
    eventPublisher.publish(rootSessionTopic, JSON.stringify(event), parentSpanCtx);
    span.end();
  });

  // sessionState.serverSeq++; // JRT - not in RA version
  const openedResponse = {
    "version": "2",
    "type": "opened",
    "seq": message.serverseq+1, //sessionState.serverSeq, //JRT - using approach from RA not V1
    "clientseq": message.seq, //sessionState.clientSeq, //JRT - using approach from RA not V1
    "id": message.id, //sessionState.sessionId, //JRT - V1 does not use message, it uses sessionState
    "parameters": {
      "organizationId": sessionState.organizationId,
      "conversationId": sessionState.conversationId,
      "participant": sessionState.participant,
      "startPaused": false, // JRT - not in V1
      "media": [
        {
          "type": "audio",
          "format": "PCMU",
          "channels": ["external", "internal"],
          "rate": 8000
        }
      ]
    }
  };

  logger.debug({
    event: 'sending_opened_response',
    sessionId: sessionState.sessionId,
    response: JSON.stringify(openedResponse, null, 2),
    timestamp: new Date().toISOString()
  });

  webSocket.send(JSON.stringify(openedResponse));
}

/**
 * Function for gracefully stopping session. Writes empty blob to each engine to flush any final transcriptions. Then calls cleanupSession.
 * 
 * @param {*} externalSpeechToTextEngine 
 * @param {*} internalSpeechToTextEngine 
 * @param {*} sessionState
 * @param {*} parentSpanCtx
 */
function stopSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx) {
  logger.info('Stopping session' + sessionState?.sessionId);

  let empty_blob = Buffer.alloc(0);
  externalSpeechToTextEngine.write(empty_blob);
  internalSpeechToTextEngine.write(empty_blob);

  //  Wait for any final transcripts to come in before closing STT engines
  setTimeout(cleanupSession, 3000, externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx);

  // JRT - in RA version, set sessionState to null.
  if (sessionState)
    sessionState = null;
}

/**
 * Function for destroying active speech engines. Sends session ended event to event listeners.
 *
 * @param {*} externalSpeechToTextEngine
 * @param {*} internalSpeechToTextEngine
 * @param {*} sessionState
 * @param {*} parentSpanCtx
 */
function cleanupSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx) {
  logger.info('Cleaning up session');
  logger.debug({
    event: 'session_stop',
    sessionId: sessionState?.sessionId,
    reason: 'normal_termination',
    timestamp: new Date().toISOString()
  });

  if (externalSpeechToTextEngine != null) {
    externalSpeechToTextEngine.removeAllListeners();
    externalSpeechToTextEngine.on('error', () => { }); // no-op
    externalSpeechToTextEngine.end(); // JRT - Kind of from RA Version (RA had endSession() which doesnt exist). Mark session as ended first... might comment out
    externalSpeechToTextEngine.destroy();
    externalSpeechToTextEngine = null;
  }

  if (internalSpeechToTextEngine != null) {
    internalSpeechToTextEngine.removeAllListeners();
    internalSpeechToTextEngine.on('error', () => { }); // no-op
    internalSpeechToTextEngine.end(); // JRT - Kind of from RA Version (RA had endSession() which doesnt exist). Mark session as ended first.. might comment out
    internalSpeechToTextEngine.destroy();
    internalSpeechToTextEngine = null;
  }

  let event = {
    'type': 'session_ended',
    'parameters': {
      'conversationid': sessionState.conversationId,
      'conversationStartTime': sessionState.conversationStartTime,
      'conversationEndTime': new Date().toISOString(),
      'session_id': sessionState.conversationId,
      'agent_id': sessionState.agent_id 
    }
  };
  eventPublisher.publish(rootTopic + sessionState.conversationId, JSON.stringify(event), parentSpanCtx);
}
/**
 * Function for sending disconnected message back on websocket. This typically happens when there is an error
 * or problem encountered here at the server. Sends disconnect only if the websocket is still open and session.
 *
 * @param {*} webSocket
 */
function sendDisconnect(webSocket, sessionState, reason) {
  logger.info('Sending disconnect to websocket with reason: ' + reason);
  if (webSocket.readyState === WebSocket.OPEN && sessionState.state != 'disconnected') {
    //sessionState.serverSeq++; //JRT -- IS THIS NEEDED, ITS IN V1 but not RA version
    sessionState.state = 'disconnected';
    webSocket.send(JSON.stringify({
      "version": "2",
      "type": "disconnect",
      "seq": sessionState.serverSeq+1, //JRT - using +1 to make it similar to the other messages back to ws
      "clientseq": sessionState.clientSeq,
      "id": sessionState.sessionId,
      "parameters": {
        "reason": reason
      }
    }));
  }
}

/**
 * Function for setting up new speech engines, update sessionState with event count.
 *    Sets up event handling functions. Data function to send transcription event to listeners
 *
 * @param {*} externalSpeechToTextEngine
 * @param {*} internalSpeechToTextEngine
 * @param {*} webSocket
 * @param {*} sessionState
 */
function setupSpeechEngine(channelName, speechToTextEngine, webSocket, sessionState, parentSpanCtx) {
  speechToTextEngine.on('listening', () => {
    logger.info(channelName + ' SpeechToTextEngine is now listening');
    sessionState.setSpeechEngineListening(channelName, true);

    if (sessionState.getPreListenCache(channelName) != null) {
      logger.debug(channelName + ' Sending cached audio data.');
      speechToTextEngine.write(sessionState.getPreListenCache(channelName));
      sessionState.setPreListenCache(channelName, null);
    }
  });

  speechToTextEngine.on('data', (sttMessage) => { 
    const { transcript } = sttMessage.results[0].alternatives[0];
    const { final } = sttMessage.results[0];

    let timestamp = new Date().toISOString(); //sttMessage.results[0].alternatives[0].timestamps[0][1];

    //  We only publish the final transcription.
    if (final) {
      tracer.startActiveSpan('speechToTextEngine.eventPublisher', { kind: SpanKind.INTERNAL }, parentSpanCtx, (span) => {
        //  Increment the event sequence number.
        sessionState.eventCount++;

        let event = {
          'type': 'transcription',
          'parameters': {
            'source': channelName,
            'text': transcript,
            'seq': sessionState.eventCount,
            'timestamp': timestamp,
            'transfertimestamp': '1999-01-01T01:01:01.154Z'
          },
          //'conversationid': sessionState.conversationId, // JRT - this was from RA version
          'agent_id': sessionState.agent_id, // this is a temporary way to route messages to agents only
        };

        logger.debug("Publish event for channel: " + channelName + " transcription: " + event.parameters.text);
        eventPublisher.publish(rootTopic + sessionState.conversationId + "/transcription", JSON.stringify(event), parentSpanCtx);
        span.end();
      });
    }
    else {
      //  Note that you will not get hypothesis with all speech models (e.g LSM does not send these)
      logger.debug(channelName + ` transcription hypothesis received:` + transcript);
    }
  });

  speechToTextEngine.on('message', (sttMessage) => {
    logger.error(channelName + ' SpeechToTextEngine received message not data: ' + sttMessage);
  });

  speechToTextEngine.on('error', (error) => {
    logger.error(error, channelName + ' SpeechToTextEngine encountered an error: ' + error.message);
    sendDisconnect(webSocket, sessionState, error);
  });

  speechToTextEngine.on('end', (reason = 'No close reason defined') => {
    logger.debug(channelName + ' SpeechToTextEngine received an end, sending a disconnect');
    sendDisconnect(webSocket, sessionState, reason);
  });

  //  This code initialzes the speech recognition engines. This kicks off the initialization process and avoids
  //  any race conditions with getting the 'listening' events back. Note that I tried to use the 'initialize'
  //  method on the SDK but that didn't seem to work.
  speechToTextEngine.write(Buffer.alloc(1));
}

/**
 *
 * @param {*} headers
 * @returns
 *    true: if headers contain a valid API KEY
 *    false: if headers do NOT contain a valid API KEY
 */
function isApiKeyValid(headers) {
  if (process.env.STREAM_CONNECTOR_API_KEY == "") {
    logger.debug('WARNING: No API key configured. Accepting websocket. Only use when testing.');
    return (true);
  }

  //  We check both cases of the x-api-key header because Genesys doc says that the header
  //  will be sent with all caps. Note that http headers in general are supposed to be case insensitive.
  if (headers.hasOwnProperty('x-api-key')) {
    if (headers['x-api-key'] !== process.env.STREAM_CONNECTOR_API_KEY) {
      logger.error('WeSocket connection does not contain a valid API Key. Rejecting webSocket.');
      return false;
    }
    else {
      logger.debug('Valid API Key detected. Setting up webSocket session.');
    }
  }
  else if (headers.hasOwnProperty('X-API-KEY')) {
    if (headers['X-API-KEY'] !== process.env.STREAM_CONNECTOR_API_KEY) {
      logger.error('WeSocket connection does not contain a valid API Key. Rejecting webSocket.');
      return false;
    }
    else {
      logger.debug('Valid API Key detected. Setting up webSocket session.');
    }
  }
  else {
    logger.error('WeSocket connection does not contain an X-API-KEY header. Rejecting webSocket.');
    return false;
  }
  return true;
}

/**
 * Handles inbound audio data from the websocket. Either writes data to the speech engine or caches it
 *
 * @param {*} channelName
 * @param {*} speechToTextEngine
 * @param {*} sessionState
 * @param {*} buffer
 */
function processReceivedData(channelName, speechToTextEngine, sessionState, buffer) {
  //logger.trace('Received audio data on ' + channelName + ' sessionId: ' + sessionState?.sessionId);

  if (speechToTextEngine != null && sessionState.isSpeechEngineListening(channelName) == true) {
    if (sessionState.receivedBufferCount % 100 == 0) {
      logger.trace({
        event: 'audio_processing',
        channel: channelName,
        sessionId: sessionState?.sessionId,
        bufferCount: sessionState.receivedBufferCount,
        bufferSize: buffer.length,
        timestamp: new Date().toISOString()
      });
    }
    speechToTextEngine.write(buffer);
  } else {
    //  Here we cache the audio until the internal speech engine is listening and ready for the data.
    if (sessionState.getPreListenCache(channelName) == null) {
      logger.trace({
        event: 'audio_caching_started',
        channel: channelName,
        sessionId: sessionState?.sessionId,
        bufferSize: buffer.length,
        timestamp: new Date().toISOString()
      });
      sessionState.setPreListenCache(channelName, buffer);
    } else {
      let newBuffer = Buffer.alloc(sessionState.getPreListenCache(channelName).length + buffer.length);
      sessionState.getPreListenCache(channelName).copy(newBuffer);
      buffer.copy(newBuffer, sessionState.getPreListenCache(channelName).length);
      sessionState.setPreListenCache(channelName, newBuffer);
      logger.trace({
        event: 'audio_cache_updated',
        channel: channelName,
        sessionId: sessionState?.sessionId,
        totalCacheSize: newBuffer.length,
        newBufferSize: buffer.length,
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Function for handling a new Genesys AudioHook connection.
 *
 * @param {*} webSocket
 * @param {*} incomingMessage
 */
function handleAudioHookConnection(webSocket, incomingMessage) {
  logger.info('Genesys websocket connection received');
  
  const parentSpan = tracer.startSpan('handleAudioHookConnection', { kind: SpanKind.SERVER });
  const parentSpanCtx = trace.setSpan(context.active(), parentSpan);
  
  let sessionState = null;
  let externalSpeechToTextEngine = null;
  let internalSpeechToTextEngine = null;

  const queryParams = url.parse(incomingMessage.url, true).query;
  logger.debug(queryParams, 'query parameters on websocket connection:');

  const { headers } = incomingMessage;
  logger.debug(headers, 'headers on websocket connection:');

  //  Check to see if the Genesys X-API-KEY matches the configured API_KEY. 
  if (!isApiKeyValid (headers)) {
    logger.error('Rejecting webSocket due to invalid API KEY.');
    webSocket.close();
    return;
  }

  webSocket.on('message', (data) => {
    try {
      if (typeof data === 'string') {
        const message = JSON.parse(data);

        // JRT - in V1 but was not in RA version
        // if (sessionState != null) {
        //   sessionState.clientSeq++;
        //   if (message.seq != sessionState.clientSeq) {
        //     logger.debug(data.length, 'FATAL PROTOCOL ERROR: Received Genesys command message from websocket connection with unexpected sequence number; seq received: ' + message.seq + 'seq expected: ' + sessionState.clientSeq);
        //   }
        // }
        logger.info('Received command message from websocket connection seq: ' + message.seq + ' data length: ' + data.length);
        handleControlMessage(message);
      } else if (Buffer.isBuffer(data)) {
        handleAudioData(data);
      } else{
        logger.info('Received unrecognized data from websocket: ' + typeof data);
      }
    } catch (err) {
      logger.error('Message processing failed', err);
      webSocket.close(1000, 'Invalid message format');
      parentSpan.end();
    }
  });

  webSocket.on('error', (err) => {
    logger.info('WebSocket connection error: ' + err?.message);
    logger.debug({
      event: 'websocket_error',
      sessionId: sessionState?.sessionId,
      error: {
        message: err.message || 'Unknown error',
        code: err.code,
        type: err.type,
        name: err.name
      }
    });

    if (sessionState) {
      //cleanupSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx);
      stopSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx);
    }
    parentSpan.end(); 
  });

  webSocket.on('close', (code, reason) => {
    logger.info('WebSocket connection closed with code: ' + code + ' reason: ' + reason);
    logger.debug({
      event: 'connection_closed',
      sessionId: sessionState?.sessionId,
      code,
      reason: reason || 'Normal closure'
    });

    if (sessionState) {
      //cleanupSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx);
      stopSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx);
    }
    parentSpan.end();
  });

  function handleControlMessage(message) {
    logger.info('Command message handling. Message type: ' + message?.type);
    if (message.type === 'ping') {
      logger.debug('Ping received from Genesys client, sending pong....');
      //sessionState.serverSeq++; //JRT FROM V1 but not in RA version
      const pongResponse = {
        "version": "2",
        "type": "pong",
        "seq": message.serverseq+1, //sessionState.serverSeq, //JRT - v1 doesnt use message and augments sessionState seq above
        "clientseq": message.seq, //sessionState.clientSeq, //JRT - v1 doesnt use message
        "id": message.id, //sessionState.sessionId, //JRT - v1 doesnt use message
        "parameters": { }
      };
      webSocket.send(JSON.stringify(pongResponse));
      return; 
    }
    else if (message.type === 'open') {
      logger.info('Open received from Genesys client....');
      sessionState = new StreamingSessionState(message);

      parentSpan.setAttribute('session_id', sessionState.conversationId);
      parentSpan.setAttribute('customer_ani', sessionState.participant.ani);

      //  Increment the client message seq number to insure protocol is valid.
      //sessionState.clientSeq++;

      // JRT - V1 does check for not probe message 
      if (message.parameters.conversationId === "00000000-0000-0000-0000-000000000000") { 
        logger.info('Probe message received');
        sendOpenedResponse(webSocket, message, sessionState);
        return;
      }

      logger.debug({
        event: 'session_start',
        sessionId: sessionState.sessionId,
        language: message.parameters.language
      });

      tracer.startActiveSpan('setup-stt', { kind: SpanKind.INTERNAL }, parentSpanCtx, (span) => {
        // externalSpeechToTextEngine = new SpeechToTextEngine(); // JRT - V1
        // internalSpeechToTextEngine = new SpeechToTextEngine(); // JRT - V1
        externalSpeechToTextEngine = new SpeechToTextEngine('external');
        internalSpeechToTextEngine = new SpeechToTextEngine('internal');
        setupSpeechEngine('external', externalSpeechToTextEngine, webSocket, sessionState, parentSpanCtx);
        setupSpeechEngine('internal', internalSpeechToTextEngine, webSocket, sessionState, parentSpanCtx);
        span.end();
      });

      tracer.startActiveSpan('sendOpenedResponse', { kind: SpanKind.INTERNAL }, parentSpanCtx, (span) => {
        sendOpenedResponse(webSocket, message, sessionState, parentSpanCtx);
        span.end();
      });
    } 
    else if (message.type === 'close') {
      logger.info('Received: Close');
      logger.debug({
        event: 'close_request',
        sessionId: message.id,
        reason: message.parameters.reason
      });

      // JRT - this was commmented out in RA version
      // const currentSeq = sessionState ? sessionState.serverSeq + 1 : 0;

      // JRT - these two were in V1 but not in RA version
      // sessionState.serverSeq++;
      if (sessionState){
        //cleanupSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, null);
        stopSession(externalSpeechToTextEngine, internalSpeechToTextEngine, sessionState, parentSpanCtx);
      }

      const closedResponse = {
        version: '2',
        type: 'closed',
        seq: message.serverseq + 1, //sessionState.serverSeq, //JRT using +1 in RA version
        clientseq: message.seq, //sessionState.clientSeq,
        id: message.id, //sessionState.sessionId
        parameters: {}
      };
      webSocket.send(JSON.stringify(closedResponse));
      
      //JRT this only in RA version
      setTimeout(() => {
        webSocket.close(1000, 'Session ended normally');
      }, 1000);

      parentSpan.end(); 
    } 
    else if (message.type === 'discarded') {
      logger.info('Discard received from Genesys client');
      logger.debug({
        event: 'audio_discarded',
        sessionId: message.id,
        start: message.parameters.start,
        discarded: message.parameters.discarded,
        position: message.position
      });

      if (sessionState) {
        const startMatch = message.parameters.start.match(/PT(\d+(?:\.\d+)?)S/);
        const startSeconds = startMatch ? parseFloat(startMatch[1]) : 0;

        const discardMatch = message.parameters.discarded.match(/PT(\d+(?:\.\d+)?)S/);
        const discardedSeconds = discardMatch ? parseFloat(discardMatch[1]) : 0;

        //sessionState.updatePosition(startSeconds * sessionState.sampleRate);
        // JRT - The following doesnt exist in the speech engine implementation.
        // if (externalSpeechToTextEngine) {
        //   externalSpeechToTextEngine.handleDiscarded(startSeconds, discardedSeconds);
        // }
        // if (internalSpeechToTextEngine) {
        //   internalSpeechToTextEngine.handleDiscarded(startSeconds, discardedSeconds);
        // }
      }
    }
    else if (message.type === "error") {
      logger.info('Error received from Genesys client with message: ' + message);
    }
    else if (message.type === "paused") {
      logger.info('Paused received from Genesys client with message: ' + message);
    }
    else if (message.type === "resumed") {
      logger.info('Resume received from Genesys client with message: ' + message);
    }
    else if (message.type === "update") {
      logger.info('Update received from Genesys client with message: ' + message);
    }
    else {
      logger.info('Unknown message type received from Genesys client with message: ' + message);
    }
  }

  function handleAudioData(data) {
    // Not in V1, assumes sessionState was setup and unpaused.
    if (!sessionState || sessionState.isPaused) {
      logger.warn('Received audio data but session is not active or is paused. Ignoring data.');
      return;
    }

    //  Track buffer count for debugging purposes
    sessionState.receivedBufferCount++;

    // Used to track received buffers in trace.
    //if (sessionState.receivedBufferCount % 100 == 0)
    //  logger.trace('Buffer received: data.length: ' + data.length);

    // FROM RA VERSION
    if (data.length % 2 !== 0) {
      logger.error({
        event: 'invalid_audio_data',
        reason: 'Incomplete samples',
        length: data.length
      });
      return;
    }

    //  Split to internal audio (agents) and external audio (customers) before passing it to the appropriate speech engines.
    const halfLength = data.length / 2;
    const externalBuffer = Buffer.alloc(halfLength);
    const internalBuffer = Buffer.alloc(halfLength);
    for (let i = 0, j = 0; i < data.length; i += 2, j++) {
      externalBuffer[j] = data[i];
      internalBuffer[j] = data[i + 1];
    }
    
    // const samplesProcessed = data.length / 2; // PCMU 8000Hz
    // sessionState.updatePosition(samplesProcessed); //JRT -> dont have this in our GenesysStreamingSessionState.js yet
    // const hasExternalAudio = hasAudioActivity(external);
    // const hasInternalAudio = hasAudioActivity(internal);
    // if (hasExternalAudio && externalSpeechToTextEngine) {
    //   externalSpeechToTextEngine.write(external);
    // }
    // if (hasInternalAudio && internalSpeechToTextEngine) {
    //   internalSpeechToTextEngine.write(internal);
    // }

    processReceivedData('external', externalSpeechToTextEngine, sessionState, externalBuffer);
    processReceivedData('internal', internalSpeechToTextEngine, sessionState, internalBuffer);
  }
}

function hasAudioActivity(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== 0) {
      return true;
    }
  }
  return false;
}

//JRT - Missing the implementation of sendPausedResponse()
function handlePause() {
  if (!sessionState.isPaused) {
    sessionState.isPaused = true;
    sendPausedResponse();
  }
}

//JRT - Missing the implementation of sendResumeResponse()
function handleResume() {
  if (sessionState.isPaused) {
    sessionState.isPaused = false;
    sendResumedResponse();
  }
}

module.exports.handleAudioHookConnection = handleAudioHookConnection;
