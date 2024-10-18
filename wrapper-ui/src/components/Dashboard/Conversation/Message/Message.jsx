import PropTypes from "prop-types";
import { useEffect, useState } from "react";

const Message = ({ data }) => {
  const [isAgentMessage, setIsAgentMessage] = useState(null);

  useEffect(() => {
    if (!data) return;
    setIsAgentMessage(data?.user_type === "agent");
  }, [data]);

  if (isAgentMessage === null) {
    return <></>;
  }
  return (
    <div className={`flex ${isAgentMessage ? "justify-start" : "justify-end"}`}>
      <div className={`flex flex-col max-w-[80%]`}>
        <p
          className={`text-[10px] ${isAgentMessage ? "text-start" : "text-end"} mb-1`}
        >
          {isAgentMessage ? "Agent" : "Customer"}
        </p>
        <div
          className={`p-2 shadow-md ${
            isAgentMessage
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-black"
          } ${isAgentMessage ? "rounded-r-lg rounded-bl-lg" : "rounded-l-lg rounded-br-lg"} mb-4`}
        >
          <p
            className={`text-sm ${isAgentMessage ? "text-white" : "text-gray-900"}`}
          >
            {data.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Message;

Message.propTypes = {
  data: PropTypes.any,
};
