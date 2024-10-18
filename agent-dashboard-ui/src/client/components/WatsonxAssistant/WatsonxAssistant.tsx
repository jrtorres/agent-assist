import { useEffect, useRef } from "react";
import * as styles from "./WatsonxAssistant.module.scss";
import * as widgetStyles from "@client/widget.module.scss";
import {useEnvVars} from "@client/providers/EnvVars"

const WatsonxAssistant = () => {
  const chatContainerRef = useRef(null);
  const scriptAddedRef = useRef(false);
  const envVars:any = useEnvVars();

  useEffect(() => {
    if (envVars.waIntegrationId && !scriptAddedRef.current) {
      scriptAddedRef.current = true;
      window.watsonAssistantChatOptions = {
        integrationID: envVars.waIntegrationId, // The ID of this integration.
        region: envVars.waRegion, // The region your integration is hosted in.
        serviceInstanceID: envVars.waServiceInstanceId, // The ID of your service instance.
        showLauncher: false,
        showRestartButton: true,
        disableSessionHistory: true,
        element: chatContainerRef.current,
        onLoad: function (instance: any) {
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
        "https://web-chat.global.assistant.watson.appdomain.cloud/versions/latest/WatsonAssistantChatEntry.js";
      document.head.appendChild(t);
    }
  }, [envVars]);
  
  return (
    <div className={widgetStyles.dashboardWidget}>
      <div
        ref={chatContainerRef}
        style={{ height: "97%", position: "relative" }}
      ></div>
    </div>
  );
};

export default WatsonxAssistant;
