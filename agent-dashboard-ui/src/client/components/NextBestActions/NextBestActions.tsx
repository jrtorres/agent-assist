

import * as styles from "./NextBestActions.module.scss";
import * as widgetStyles from "@client/widget.module.scss";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {SocketPayload, useSocketEvent, useSocket} from "@client/providers/Socket";
import BestAction from "./BestAction";
import * as _ from "lodash";
import {InlineLoading} from "@carbon/react";

export enum ActionState {
  active = "active",
  stale = "stale",
  expired = "expired",
  complete = "complete"
}

export type Action = {
  text: string;
  actionId: number;
  state: ActionState;
  createdAt: number
}

const NextBestActions = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const {t} = useTranslation();
  const {lastMessage} = useSocketEvent('celeryMessage');
  const {socket} = useSocket();
  const [sessionId, setSessionId] = useState<String>();

  useEffect(() => {
    if (lastMessage) {
      const payload: SocketPayload = JSON.parse(lastMessage?.payloadString);
      console.log(payload)

      const action: Action = {
        text: payload?.parameters?.text || "",
        actionId: payload?.parameters?.action_id || 0,
        state: ActionState.active,
        createdAt: new Date().getTime()
      };

      if (payload?.type === "new_action") {
        setActions(prevState => [...prevState, action]);
      } else if (payload?.type === "session_started") {
        // trying to grab the session ID when receiving the session open message
        // we need this along with the agent id when sending an manual action on click message back to socketio
        setSessionId(payload.parameters.session_id)
      } else if (payload?.type === "completed_action") {
        action.state = ActionState.complete;
        updateAction(action);
        // const payload = {
        //   destination: `agent-assist/${session_id}/ui`,
        //   text: "Next step"
        // }
        // socket.emit("webUiMessage", JSON.stringify(payload))
      }
    }
  }, [lastMessage])

  const updateAction = (action: Action) => {
    setActions(prevState => {
      const actionToUpdate: Action | undefined = _.find(prevState, value => value.actionId === action?.actionId);

      if (actionToUpdate) {
        actionToUpdate.state = action.state;
        actionToUpdate.text = action.text;
      }

      return prevState;
    });
  };

  // this emits a message back to api-server, which then creates a celery task
  const sendManualCompletion = () => {
    const payload = {
      destination: `agent-assist/${sessionId}/ui`,
      text: "Next step"
    }
    console.log(payload)
    socket.emit("webUiMessage", JSON.stringify(payload))
  }

  return (
    <div className={widgetStyles.dashboardWidget}>
      <div className={widgetStyles.widgetTitle}>
        {t("nextBestAction")}
      </div>
      <div className={styles.actionTileContainer}>
        {actions.length ? actions.map((action, id) =>
            <BestAction key={id} action={action} updateAction={updateAction} sendManualCompletion={sendManualCompletion}></BestAction>) :
          <InlineLoading description={t("loadingAction")}/>}
      </div>
    </div>
  );
};

export default NextBestActions;