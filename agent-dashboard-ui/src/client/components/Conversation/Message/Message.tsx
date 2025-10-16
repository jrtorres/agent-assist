import { useEffect, useState } from "react";

// Define the type for the message data
interface MessageData {
  text: string;
  user_type: "agent" | "customer" | string;
  [key: string]: any;
}

interface MessageProps {
  data: MessageData;
}

const Message: React.FC<MessageProps> = ({ data }) => {
  const [isAgentMessage, setIsAgentMessage] = useState<boolean | null>(null);

  useEffect(() => {
    if (!data) return;
    setIsAgentMessage(data.user_type === "agent");
  }, [data]);

  if (isAgentMessage === null) return null;

  // Inline styles so we don't rely on Tailwind
  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: isAgentMessage ? "flex-start" : "flex-end",
    paddingLeft: 8,
    paddingRight: 8,
    marginBottom: 6,
  };

  const columnStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    maxWidth: "80%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    marginBottom: 6,
    color: "#6b7280", // muted gray
    textAlign: isAgentMessage ? "left" : "right",
  };

  // bubble styles: agent = dark left bubble, customer = white right bubble
  const bubbleCommon: React.CSSProperties = {
    padding: "12px 16px",
    boxShadow: "0 4px 8px rgba(15, 23, 42, 0.06)",
    lineHeight: 1.3,
  };

  const agentBubble: React.CSSProperties = {
    ...bubbleCommon,
    backgroundColor: "#0f1724", // dark
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.03)",
    borderRadius: "18px 18px 18px 6px", // rounded, small notch on right-bottom
    alignSelf: "flex-start",
  };

  const customerBubble: React.CSSProperties = {
    ...bubbleCommon,
    backgroundColor: "#ffffff",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: "18px 18px 6px 18px", // mirrored corners
    alignSelf: "flex-end",
  };

  return (
    <div style={wrapperStyle}>
      <div style={columnStyle}>
        <div style={labelStyle}>{isAgentMessage ? "Agent" : "Customer"}</div>
        <div style={isAgentMessage ? agentBubble : customerBubble}>
          <div style={{ fontSize: 14 }}>{data.text}</div>
        </div>
      </div>
    </div>
  );
};

export default Message;
