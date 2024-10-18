import "./App.css";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import { useContext, useEffect } from "react";
import useSocketio from "./hooks/useSocketio";

import { sessionUsers } from "./utils/data";
import { AppContext } from "./context/context";

function App() {
 // const { initializeMqtt } = useMqqt();
  const { dispatch } = useContext(AppContext);


  const {socket, connected, error} = useSocketio();
  // useEffect(() => {
  //   initializeMqtt();
  // }, []);

  useEffect(() => {
    const fetchAllSessionsFromDb = async () => {
      const url = "http://localhost/event-archiver/agent-assist-search/sessions?state=inactive";
      const apiKey = "";
  
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `ApiKey ${apiKey}`,
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        // Get the response as text
        let responseText = await response.text();
        
        // Find the first occurrence of '[' which marks the beginning of your JSON array
        const startIndex = responseText.indexOf('[');
        if (startIndex === -1) {
          throw new Error('Valid JSON not found in response');
        }
  
        // Extract the JSON string from the startIndex to the end
        const jsonString = responseText.substring(startIndex);
        
        // Parse the extracted JSON string
        const data = JSON.parse(jsonString);
        console.log(data);
        dispatch({ type: "AddAllSessions", payload: data });
      } catch (error) {
        console.error("Error fetching session data:", error);
      }
    };
  
    fetchAllSessionsFromDb();
  }, [dispatch]);
  
  
  
  
  
  

  /**
   *
   * a function that adds a new session to the global state of the app
   */
  // const addNewSession = () => {
  //   const new_session = {
  //     phone: "+31515926535",
  //     caller_id: "Hary lwinson",
  //     DID: "+92234S678901",
  //     is_active: true,
  //     session_id: "1523367890ABCDEF",
  //     sentiment: "happy",
  //   };

  //   dispatch({ type: "AddNewSession", payload: new_session });
  // };

  return (
    <>
      <div className="App p-2 rounded-sm h-[100vh] overflow-hidden bg-[#3f4040]/85">
        <Routes>
          <Route path="/" element={<Dashboard />} />

          {/* Old way
          <Route path="/" element={<Navigate to={"/dashboard"} />} />
          <Route path={"/dashboard"} element={<Dashboard />} /> */}
        </Routes>
      </div>
    </>
  );
}

export default App;
