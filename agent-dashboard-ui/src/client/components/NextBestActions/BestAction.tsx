

import * as styles from "./BestAction.module.scss";
import {ClickableTile, Tooltip} from "@carbon/react";
import {useTranslation} from "react-i18next";
import {v4 as uuid} from 'uuid';
import {Action, ActionState} from "./NextBestActions";
import {Checkmark, CloseFilled, Hourglass, Result} from "@carbon/icons-react";
import sanitizeHtml from 'sanitize-html';
import {useEffect, useState} from "react";
import {useSocket} from "@client/providers/Socket";

type ActionOptions = {
  icon: any,
  style: any
}

const BestAction = ({action, updateAction, sendManualCompletion}: { action: Action, updateAction: (action: Action) => void, sendManualCompletion: ()=> void }) => {
  const {t} = useTranslation();
  const {socket} = useSocket();

  const getIcon = (state: ActionState) => {
    switch (state) {
      case ActionState.active:
        return Result;
      case ActionState.stale:
        return Hourglass;
      case ActionState.expired:
        return CloseFilled;
      case ActionState.complete:
        return Checkmark;
    }
  };

  const [actionOptions, setActionOptions] = useState<ActionOptions>({
    icon: getIcon(action.state),
    style: styles[action.state]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (action?.state !== ActionState.complete) {
        const passedTime = (new Date().getTime() - action.createdAt) / 1000;

        if (passedTime > 15 && passedTime < 30) {
          action.state = ActionState.stale;
        } else if (passedTime >= 30) {
          action.state = ActionState.expired;
        } else {
          action.state = ActionState.active;
        }
      }

      setActionOptions({
        icon: getIcon(action.state),
        style: styles[action.state]
      });

      if (action?.state === ActionState.expired || action?.state === ActionState.complete) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [action]);

  const completeAction = () => {
    if (action?.state !== ActionState.complete) {
      action.state = ActionState.complete;
      updateAction(action);
      setActionOptions({
        icon: getIcon(action.state),
        style: styles[action.state]
      });
      sendManualCompletion()
    }
  }

  return (
    <div className={`${styles.actionTile} ${actionOptions.style}`}>
      <Tooltip label={t("clickToComplete")} align="bottom" autoAlign className={styles.tooltip}>
        <ClickableTile id={uuid()} renderIcon={actionOptions.icon} onClick={completeAction}>
          <div dangerouslySetInnerHTML={{__html: sanitizeHtml(action.text)}}></div>
        </ClickableTile>
      </Tooltip>
    </div>
  );
};

export default BestAction;