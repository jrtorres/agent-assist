
import { Suspense } from "react";
import Dashboard from "@client/components/Dashboard/Dashboard";
import { AppProvider } from "@client/providers/AppProvider";
import { AppContextProvider } from "@client/context/AppContext";
import { Loading } from "@carbon/react";

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <AppProvider>
        <AppContextProvider>
          <Dashboard />
        </AppContextProvider>
      </AppProvider>
    </Suspense>
  );
};

export default App;