import { useAuthenticatedSocket } from "./useAuthenticatedSocket.js";
import { useContext, useEffect } from "react";
import { useSocketEvent } from 'socket.io-react-hook'
import { AppContext } from "../context/context";
import {
  transformSessionData,
  extractSessionId,
  transformTranscriptionData,
  transformSummaryData,
  transformNextBestActionData,
  markActionAsCompleted,
  transformSentimentData,
  startSentimentData,
} from "../libs/Mqtt/MqttMethods.js";

import { useAgentId } from "./useAgentIdProvider.jsx";

const useSocketio = () => {
  const { agentId } = useAgentId()

  let client = null;
  const { socket, connected, error } = useAuthenticatedSocket("/");
  useEffect(() => {
    if (error) {
      console.error(error)
    }
  }, [error])

  useEffect(() => {
    console.log(`ws connect: ${connected}`)
  }, [connected])

  socket.on('connect', () => {
    console.log('Connected to api socketio server');

    // Join the chat room - used to isolate communications
    console.log("joining room: ", agentId)
    socket.emit('joinRoom', agentId);
  });

  // When the client reconnects to the server
  socket.on('reconnect', () => {
    console.log('Reconnected to socketio server');

    // Join the chat room on reconnect
    console.log("joining room: ", agentId)
    socket.emit('joinRoom', agentId);
  });



  const { dispatch } = useContext(AppContext);

  const onMessageArrived = (message) => {
    console.log("MQTT Message Arrived:", message.payloadString);
    handleMessage(JSON.parse(message.payloadString), message.destinationName);
  };

  const handleMessage = (payload, topic) => {
    console.log("Received topic:", topic, "Payload:", payload);
    if (topic.startsWith("agent-assist/session")) {
      const transformedData = transformSessionData(payload.parameters);
      const sentData1 = startSentimentData(payload.parameters, "external");
      const sentData2 = startSentimentData(payload.parameters, "internal");
      console.log("Transformed session data:", transformedData);
      dispatch({ type: "AddNewSession", payload: transformedData });
      dispatch({ type: "AddOrUpdateSentimentData", payload: sentData1 });
      dispatch({ type: "AddOrUpdateSentimentData", payload: sentData2 });
    } else if (payload.type === "session_ended") {
      console.log("Ending session with ID:", extractSessionId(topic));
      dispatch({
        type: "EndSession",
        payload: { sessionId: extractSessionId(topic) },
      });
    } else if (topic.includes("/transcription")) {
      const transformedData = transformTranscriptionData(payload, topic);
      console.log("Transformed conversation data:", transformedData);
      dispatch({ type: "AddMessagesToConversation", payload: transformedData });
    } else if (topic.includes("/summarization")) {
      const summaryData = transformSummaryData(payload, topic);
      console.log("Transformed summary data:", summaryData);
      dispatch({ type: "UpdateCallSummary", payload: summaryData });
    } else if (topic.includes("/nextbestaction")) {
      const sessionId = extractSessionId(topic);
      if (payload.type === "new_action") {
        const actionData = transformNextBestActionData(
          payload.parameters,
          sessionId,
        );
        dispatch({ type: "AddOrUpdateBestActionData", payload: actionData });
      } else if (payload.type === "completed_action") {
        const completedAction = markActionAsCompleted(
          payload.parameters.action_id,
          sessionId,
        );
        dispatch({ type: "MarkActionAsCompleted", payload: completedAction });
      }
    } else if (topic.includes("/sentiment")) {
      const sentimentData = transformSentimentData(payload, topic);
      dispatch({ type: "AddOrUpdateSentimentData", payload: sentimentData });
    } else if (topic.includes("/extraction")) {
      const sessionId = extractSessionId(topic);
      if (payload.type === "extraction") {
        const entityData = {
          session_id: sessionId,
          title: payload.parameters.title,
          value: payload.parameters.value,
        };
        dispatch({ type: "AddOrUpdateExtractedEntity", payload: entityData });
      }
    }
  };

  // this is triggered when a notification message is received
  useSocketEvent(socket, "celeryMessage", { onMessage: onMessageArrived })

  return { socket, connected, error }
};

export default useSocketio;
