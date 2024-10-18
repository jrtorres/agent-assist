


import ExtractedEntities from "@client/components/ExtractedEntities/ExtractedEntities";
import {Column, Grid} from "@carbon/react";
import NextBestActions from "@client/components/NextBestActions/NextBestActions";
import CallSummary from "@client/components/CallSummary/CallSummary";
import WatsonxAssistant from "@client/components/WatsonxAssistant/WatsonxAssistant";

import * as styles from "./Dashboard.module.scss";

const Dashboard = () => {
  return (
    <Grid narrow fullWidth className={styles.dashboard}>
      <Column sm={4} md={4} lg={8}>
        <ExtractedEntities/>
        <WatsonxAssistant/>
      </Column>
      <Column sm={4} md={4} lg={8}>
        <NextBestActions/>
        <CallSummary/>
      </Column>
    </Grid>
  );
};

export default Dashboard;