

import * as styles from "./CallSummary.module.scss";
import * as widgetStyles from "@client/widget.module.scss";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {SocketPayload, useSocketEvent} from "@client/providers/Socket";
import {InlineLoading} from "@carbon/react";

const CallSummary = () => {
  const [summary, setSummary] = useState<string>("");
  const {t} = useTranslation();
  const {lastMessage} = useSocketEvent('celeryMessage')

  useEffect(() => {
    if (lastMessage) {
      const payload: SocketPayload = JSON.parse(lastMessage?.payloadString);

      if (payload?.type === "summary" && payload?.parameters?.text) {
        setSummary(payload?.parameters?.text?.trim() || "");
      }
    }
  }, [lastMessage])

  return (
    <div className={widgetStyles.dashboardWidget}>
      <div className={widgetStyles.widgetTitle}>
        {t("callSummary")}
      </div>
      <div className={styles.summaryText}>
        <pre>
          {summary ? summary : <InlineLoading description={t("loadingSummary")}/>}
        </pre>
      </div>
    </div>
  );
};

export default CallSummary;