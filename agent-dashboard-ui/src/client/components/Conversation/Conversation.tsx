import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "@client/context/AppContext";
import Message from "./Message/Message";
import { SocketPayload, useSocketEvent } from "@client/providers/Socket";
import * as widgetStyles from "@client/widget.module.scss";

// types (same as your original)
interface MessageData {
  session_id: string;
  text: string;
  user_type: "agent" | "customer" | string;
  seq?: number;
  timestamp?: number;
  [key: string]: any;
}

interface SessionUser {
  session_id: string;
}

interface AppState {
  currentSessionUser?: SessionUser;
  conversations: MessageData[];
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

const Conversation: React.FC = () => {
  const { state } = useContext(AppContext) as AppContextType;
  const { currentSessionUser, conversations } = state;

  const scrollableAreaRef = useRef<HTMLDivElement | null>(null);
  const { lastMessage } = useSocketEvent("celeryMessage");

  // keep your original local state & logic exactly
  const [localConversations, setLocalConversations] = useState<MessageData[]>([]);

  useEffect(() => {
    if (scrollableAreaRef.current) {
      // smooth scroll to bottom when new messages arrive
      scrollableAreaRef.current.scrollTop = scrollableAreaRef.current.scrollHeight;
    }
  }, [localConversations]);

  useEffect(() => {
    if (!lastMessage) return;

    const payload: SocketPayload = JSON.parse(lastMessage.payloadString);
    const params = payload.parameters as any;
    if (!params) return;

    if (payload.type === "transcription") {
      const newMessage: MessageData = {
        session_id: lastMessage.agent_id,
        text: params.text || "",
        user_type: params.source === "internal" ? "agent" : "customer",
        seq: params.seq,
        timestamp: params.timestamp,
      };
      setLocalConversations((prev) => [...prev, newMessage]);
    }
  }, [lastMessage]);

  const displayedConversations = [
    ...(conversations || []),
    ...localConversations,
  ];

  // Inline styles to avoid Tailwind dependency
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "480px",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 20,
    marginLeft: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "1px solid #eef2f6",
    fontWeight: 600,
  };

  // this area scrolls independently and uses padding, won't overflow chart
  const scrollAreaStyle: React.CSSProperties = {
    overflowY: "auto",
    flexGrow: 1,
    padding: "12px",
    boxSizing: "border-box",
    // keep it constrained inside the widget. Adjust as needed.
    maxHeight: "calc(100% - 64px)",
    width: "100%",
  };

  return (
    <div className={`${widgetStyles.dashboardWidget}`} style={containerStyle}>
      <p style={headerStyle}>Conversation</p>

      <div ref={scrollableAreaRef} style={scrollAreaStyle}>
        {/* preserve your prior rendering logic (no filtering by session unless you want) */}
        {displayedConversations.map((message, index) => (
          <Message key={`${message.session_id}-${index}`} data={message} />
        ))}
      </div>
    </div>
  );
};

export default Conversation;
