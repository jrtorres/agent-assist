import React, { createContext, useReducer, ReactNode, Dispatch } from "react";

// ================== Interfaces ==================
export interface SessionUser {
  phone: string;
  caller_id: string;
  DID: string;
  is_active: boolean;
  session_id: string;
  sentiment: string;
  time_started: string;
  time_ended: string;
}

export interface SentimentData {
  session_id: string;
  source: "internal" | "external";
  sadness: number;
  joy: number;
  fear: number;
  disgust: number;
  anger: number;
}

export interface ConversationMessage {
  session_id: string;
  user_type: "agent" | "customer";
  text: string;
}

export interface BestAction {
  action_id: string;
  is_completed: boolean;
  text: string;
}

export interface BestActionData {
  session_id: string;
  action: BestAction[];
}

export interface CallSummary {
  session_id: string;
  summary: string;
}

export interface ExtractedEntity {
  session_id: string;
  title: string;
  [key: string]: any;
}

export interface AppState {
  sessionUsers: SessionUser[];
  currentSessionUser: SessionUser | null;
  callSummary: CallSummary[];
  bestActionData: BestActionData[];
  conversations: ConversationMessage[];
  sentimentData: SentimentData[];
  extractionData: any[];
  extractedEntities: ExtractedEntity[];
}

// ================== Action Types ==================
export type Action =
  | { type: "AddAllSessions"; payload: any[] }
  | { type: "AddNewSession"; payload: any }
  | { type: "AddCurrentSessionUser"; payload: any }
  | { type: "addConversation"; payload: any[] }
  | { type: "AddOrUpdateSentimentData"; payload: any }
  | { type: "AddMessagesToConversation"; payload: any }
  | { type: "AddOrUpdateExtractedEntity"; payload: any }
  | { type: "AddOrUpdateBestActionData"; payload: any }
  | { type: "MarkActionAsCompleted"; payload: any }
  | { type: "EndSession"; payload: any }
  | { type: "UpdateCallSummary"; payload: any }
  | { type: "UpdateBestActionData"; payload: any };

// ================== Initial State ==================
const initialState: AppState = {
  sessionUsers: [],
  currentSessionUser: null,
  callSummary: [],
  bestActionData: [],
  conversations: [],
  sentimentData: [],
  extractionData: [],
  extractedEntities: [],
};

// ================== Context ==================
export const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

// ================== Reducer ==================
const reducer = (state: AppState, action: Action): AppState => {
  let sessionIndex: number | null = null;
  console.log("Reducer action:", action);

  switch (action.type) {
    case "AddAllSessions": {
      const transformedSessions = action.payload.map((session: any) => {
        const { parameters, session_id } = session;
        return {
          phone: parameters.customer_ani,
          caller_id: parameters.customer_name,
          DID: parameters.dnis,
          is_active: parameters.state === "active",
          session_id,
          sentiment: "neutral",
          time_started: parameters.time_started,
          time_ended: parameters.time_ended,
        };
      });
      return { ...state, sessionUsers: transformedSessions };
    }

    case "AddNewSession": {
      const updatedSessionUsers = [...state.sessionUsers, action.payload];
      const newCurrentSessionUser =
        state.currentSessionUser ?? action.payload;
      return {
        ...state,
        sessionUsers: updatedSessionUsers,
        currentSessionUser: newCurrentSessionUser,
      };
    }

    case "AddCurrentSessionUser":
      return { ...state, currentSessionUser: action.payload };

    case "addConversation":
      return { ...state, conversations: action.payload };

    case "AddMessagesToConversation":
      return {
        ...state,
        conversations: [...state.conversations, action.payload],
      };

    case "AddOrUpdateSentimentData": {
      const existingIndex = state.sentimentData.findIndex(
        (data) =>
          data.session_id === action.payload.session_id &&
          data.source === action.payload.source
      );

      const updatedSentimentData = [...state.sentimentData];
      if (existingIndex !== -1)
        updatedSentimentData[existingIndex] = action.payload;
      else updatedSentimentData.push(action.payload);

      return { ...state, sentimentData: updatedSentimentData };
    }

    case "AddOrUpdateExtractedEntity": {
      const existingEntityIndex = state.extractedEntities.findIndex(
        (entity) =>
          entity.session_id === action.payload.session_id &&
          entity.title === action.payload.title
      );

      if (existingEntityIndex !== -1) {
        const updatedEntities = [...state.extractedEntities];
        updatedEntities[existingEntityIndex] = action.payload;
        return { ...state, extractedEntities: updatedEntities };
      } else {
        return {
          ...state,
          extractedEntities: [...state.extractedEntities, action.payload],
        };
      }
    }

    case "AddOrUpdateBestActionData": {
      sessionIndex = state.bestActionData.findIndex(
        (session) => session.session_id === action.payload.session_id
      );

      if (sessionIndex !== -1) {
        const updatedSession: BestActionData = {
          ...state.bestActionData[sessionIndex]!,
          action: [
            ...(state.bestActionData[sessionIndex]!.action ?? []),
            action.payload.action,
          ],
        };

        return {
          ...state,
          bestActionData: [
            ...state.bestActionData.slice(0, sessionIndex),
            updatedSession,
            ...state.bestActionData.slice(sessionIndex + 1),
          ],
        };
      } else {
        const newSession: BestActionData = {
          session_id: action.payload.session_id,
          action: [action.payload.action],
        };

        return {
          ...state,
          bestActionData: [...state.bestActionData, newSession],
        };
      }
    }

    case "MarkActionAsCompleted":
      return {
        ...state,
        bestActionData: state.bestActionData.map((session) =>
          session.session_id === action.payload.session_id
            ? {
                ...session,
                action: session.action.map((act) =>
                  act.action_id === action.payload.action_id
                    ? { ...act, is_completed: true }
                    : act
                ),
              }
            : session
        ),
      };

    case "EndSession": {
      const updatedSessionUsers = state.sessionUsers.map((session) =>
        session.session_id === action.payload.sessionId
          ? { ...session, is_active: false }
          : session
      );
      return { ...state, sessionUsers: updatedSessionUsers };
    }

    case "UpdateCallSummary": {
      const updatedCallSummaries = [...state.callSummary];
      const existingIndex = updatedCallSummaries.findIndex(
        (summary) => summary.session_id === action.payload.session_id
      );

      if (existingIndex !== -1)
        updatedCallSummaries[existingIndex] = action.payload;
      else updatedCallSummaries.push(action.payload);

      return { ...state, callSummary: updatedCallSummaries };
    }

    case "UpdateBestActionData":
      return {
        ...state,
        bestActionData: state.bestActionData.map((actionItem) =>
          actionItem.session_id === action.payload.session_id
            ? { ...actionItem, text: action.payload.text }
            : actionItem
        ),
      };

    default:
      return state;
  }
};

// ================== Provider ==================
export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
