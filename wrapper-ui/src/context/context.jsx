import { createContext, useReducer } from "react";
import PropTypes from "prop-types";

export const AppContext = createContext();

const initialState = {
  sessionUsers: [],
  currentSessionUser: null,
  callSummary: [],
  bestActionData: [],
  conversations: [],
  sentimentData: [],
  extractionData: [],
  extractedEntities: [],
};

const reducer = (state, action) => {
  let sessionIndex = null;

  console.log("Reducer action:", action);
  switch (action.type) {
    case "AddAllSessions":
      const transformedSessions = action.payload.map(session => {
        const { parameters, session_id } = session;
        return {
          phone: parameters.customer_ani,
          caller_id: parameters.customer_name,
          DID: parameters.dnis,
          is_active: parameters.state === "active",
          session_id: session_id,
          sentiment: "neutral", 
          time_started: parameters.time_started,
          time_ended: parameters.time_ended,
        };
      });
      return {
        ...state,
        sessionUsers: transformedSessions,
      };



      case "AddNewSession":
        const updatedSessionUsers = [...state.sessionUsers, action.payload];
        const newCurrentSessionUser = state.currentSessionUser ? state.currentSessionUser : action.payload;
      
        return {
          ...state,
          sessionUsers: updatedSessionUsers,
          currentSessionUser: newCurrentSessionUser,
        };
      

    case "AddCurrentSessionUser":
      return {
        ...state,
        currentSessionUser: action.payload,
      };

    case "addConversation":
      return {
        ...state,
        conversations: action.payload,
      };

      case "AddOrUpdateSentimentData":
        const existingIndex = state.sentimentData.findIndex((data) => data.session_id === action.payload.session_id && data.source === action.payload.source);
        let updatedSentimentData = [...state.sentimentData];
      
        if (existingIndex !== -1) {
          updatedSentimentData[existingIndex] = action.payload;
        } else {
          updatedSentimentData = [...state.sentimentData, action.payload];
        }
      
        return {
          ...state,
          sentimentData: updatedSentimentData,
        };
      

    case "AddMessagesToConversation":
      return {
        ...state,
        conversations: [...state.conversations, action.payload],
      };

      case "AddOrUpdateExtractedEntity":
        const existingEntityIndex = state.extractedEntities.findIndex(entity => entity.session_id === action.payload.session_id && entity.title === action.payload.title);
      
        if (existingEntityIndex !== -1) {
          // Update existing entity
          const updatedEntities = [...state.extractedEntities];
          updatedEntities[existingEntityIndex] = action.payload;
          return { ...state, extractedEntities: updatedEntities };
        } else {
          // Add new entity
          return { ...state, extractedEntities: [...state.extractedEntities, action.payload] };
        }

    case "AddOrUpdateBestActionData":
      sessionIndex = state.bestActionData.findIndex(
        (session) => session.session_id === action.payload.session_id,
      );
      if (sessionIndex !== -1) {
        // Session exists, update its actions
        const updatedSession = { ...state.bestActionData[sessionIndex] };
        updatedSession.action = [
          ...updatedSession.action,
          action.payload.action,
        ];
        return {
          ...state,
          bestActionData: [
            ...state.bestActionData.slice(0, sessionIndex),
            updatedSession,
            ...state.bestActionData.slice(sessionIndex + 1),
          ],
        };
      } else {
        // Session does not exist, add new session with action
        return {
          ...state,
          bestActionData: [
            ...state.bestActionData,
            {
              session_id: action.payload.session_id,
              action: [action.payload.action],
            },
          ],
        };
      }

    case "MarkActionAsCompleted":
      return {
        ...state,
        bestActionData: state.bestActionData.map((session) => {
          if (session.session_id === action.payload.session_id) {
            return {
              ...session,
              action: session.action.map((act) => {
                if (act.action_id === action.payload.action_id) {
                  return { ...act, is_completed: true };
                }
                return act;
              }),
            };
          }
          return session;
        }),
      };

    case "EndSession": {
      const updatedSessionUsers = state.sessionUsers.map((session) => {
        if (session.session_id === action.payload.sessionId) {
          return { ...session, is_active: false };
        }
        return session;
      });

      return {
        ...state,
        sessionUsers: updatedSessionUsers,
      };
    }
    case "UpdateCallSummary": {
      // Find and update the summary for the specific session
      const updatedCallSummaries = state.callSummary.map((summary) => {
        if (summary.session_id === action.payload.session_id) {
          return { ...summary, summary: action.payload.summary };
        }
        return summary;
      });

      // Optionally, handle the case where a summary for the session doesn't exist yet
      if (!updatedCallSummaries.find(
          (summary) => summary.session_id === action.payload.session_id,)) {
        updatedCallSummaries.push(action.payload);
      }

      return { ...state, callSummary: updatedCallSummaries };
    }

    case "UpdateBestActionData":
      return {
        ...state,
        bestActionData: state.bestActionData.map((action) =>
          action.session_id === action.payload.session_id
            ? { ...action, text: action.payload.text }
            : action,
        ),
      };

    default:
      return state;
  }
};

export const AppContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.any,
};
