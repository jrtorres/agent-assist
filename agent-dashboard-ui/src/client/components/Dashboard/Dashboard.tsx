


import ExtractedEntities from "@client/components/ExtractedEntities/ExtractedEntities";
import {Column, Grid} from "@carbon/react";
import NextBestActions from "@client/components/NextBestActions/NextBestActions";
import CallSummary from "@client/components/CallSummary/CallSummary";
import WatsonxAssistant from "@client/components/WatsonxAssistant/WatsonxAssistant";

import * as styles from "./Dashboard.module.scss";

import Conversation from "@client/components/Conversation/Conversation";
import SentimentProgress from "@client/components/SentimentProgress/SentimentProgress";


// const Dashboard = () => {
//   return (
//     <Grid narrow fullWidth className={styles.dashboard}>
//       <Column sm={4} md={4} lg={8}>
//         <ExtractedEntities/>
//         <WatsonxAssistant/>
//       </Column>
//       <Column sm={4} md={4} lg={8}>
//         <NextBestActions/>
//         <CallSummary/>
//       </Column>
//     </Grid>
//   );
// };

const Dashboard = () => {
  return (
    <Grid narrow fullWidth className={styles.dashboard}>
      <Column sm={4} md={4} lg={5}>
        <ExtractedEntities />
        <WatsonxAssistant />
      </Column>
      <Column sm={4} md={4} lg={5}>
        <NextBestActions />
        <CallSummary />
      </Column>
      <Column sm={4} md={8} lg={6}>
        <Conversation />
        <SentimentProgress />
      </Column>
    </Grid>
  );
};


export default Dashboard;