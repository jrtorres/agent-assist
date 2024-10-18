

import {Suspense} from "react";
import Dashboard from "@client/components/Dashboard/Dashboard";
import {AppProvider} from "@client/providers/AppProvider";
import {Loading} from "@carbon/react";

const App = () => {
  return (
    <Suspense fallback={<Loading/>}>
      <AppProvider>
        <Dashboard></Dashboard>
      </AppProvider>
    </Suspense>
  );
};

export default App;
