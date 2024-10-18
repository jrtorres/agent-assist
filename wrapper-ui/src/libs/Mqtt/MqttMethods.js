// src/libs/MqttMethods.js

export const transformSessionData = (payload) => {
  return {
    phone: payload.customer_ani,
    caller_id: payload.customer_name || process.env.VITE_MQTT_CALLER_ID,
    DID: payload.dnis,
    is_active: true,
    session_id: payload.session_id,
    sentiment: "",
  };
};

export const extractSessionId = (topic) => {
  const parts = topic.split("/");
  return parts.length >= 2 ? parts[1] : null;
};

export const transformTranscriptionData = (payload, topic) => {
  const sessionId = extractSessionId(topic);
  return {
    session_id: sessionId,
    text: payload.parameters.text,
    user_type: payload.parameters.source === "external" ? "customer" : "agent",
    seq: payload.parameters.seq, // Add the sequence number to the transformed data
  };
};

export const transformSummaryData = (payload, topic) => {
  const sessionId = extractSessionId(topic);
  return {
    session_id: sessionId,
    summary: payload.parameters.text,
  };
};

// Add to MqttMethods.js

export const transformNextBestActionData = (parameters, sessionId) => {
  const actionWithOptions = {
    content: parameters.text,
    action_id: parameters.action_id,
    time: new Date().toISOString(),
    is_completed: false,
    options: parameters.options || [],
    session_id: sessionId,
  };

  return {
    session_id: sessionId,
    action: actionWithOptions,
  };
};

export const markActionAsCompleted = (actionId, sessionId) => {
  return {
    session_id: sessionId,
    action_id: actionId,
  };
};

export const transformSentimentData = (payload, topic) => {
  const sessionId = extractSessionId(topic);
  const parameters = payload.parameters;
  return {
    session_id: sessionId,
    source: parameters.source,
    sadness: parseFloat(parameters.sadness) || 0,
    joy: parseFloat(parameters.joy) || 0,
    fear: parseFloat(parameters.fear) || 0,
    disgust: parseFloat(parameters.disgust) || 0,
    anger: parseFloat(parameters.anger) || 0,
  };
};


export const startSentimentData = (payload, source) => {
  return {
    session_id: payload.session_id,
    source: source,
    sadness: 0.5,
    joy: 0.5,
    fear: 0.5,
    disgust: 0.5,
    anger: 0.5,
  };
};

