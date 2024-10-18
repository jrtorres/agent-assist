import { useEffect, useRef } from "react";

const WatsonAssistant = () => {
  const chatContainerRef = useRef(null);
  const scriptAddedRef = useRef(false);

  useEffect(() => {
    if (!scriptAddedRef.current) {
      scriptAddedRef.current = true;

      window.watsonAssistantChatOptions = {
        integrationID: process.env.VITE_WA_INTEGRATION_ID, // The ID of this integration.
        region: process.env.VITE_WA_REGION, // The region your integration is hosted in.
        serviceInstanceID: process.env.VITE_WA_SERVICE_INSTANCE_ID, // The ID of your service instance.
        showLauncher: false,
        showRestartButton: true,
        disableSessionHistory: true,
        element: chatContainerRef.current,
        onLoad: function (instance) {
          window.watsonAssistantChatInstance = instance;
          
          //  Disable the Home Screen
          instance.updateHomeScreenConfig({
            is_on: false
          });

          //  Restart the conversation on startup
          console.log("Restarting watson assistand conversations.");
          instance.restartConversation();
          
          instance.render().then(() => {
            if (!instance.getState().isWebChatOpen) {
              instance.openWindow();
            }
          });
        },
      };

      const t = document.createElement("script");
      t.src =
        "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
        (window.watsonAssistantChatOptions.clientVersion || "latest") +
        "/WatsonAssistantChatEntry.js";
      document.head.appendChild(t);
    }
  }, []);

  return (
    <div className="flex-[6] h-[99%] w-full ml-2 mr-1">
      <div
        ref={chatContainerRef}
        style={{ height: "97%", position: "relative" }}
      ></div>
    </div>
  );
};

export default WatsonAssistant;
