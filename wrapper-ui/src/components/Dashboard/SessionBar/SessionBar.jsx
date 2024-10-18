import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../context/context";
import SessionUser from "../SessionUser/SessionUser";
import { Accordion } from "@chakra-ui/react";

const SessionBar = () => {
  const { sessionUsers } = useContext(AppContext);
  const [activeSession, setActiveSession] = useState([]);
  const [completedSession, setCompletedSession] = useState([]);

  useEffect(() => {
    setActiveSession(sessionUsers.filter((session) => session.is_active));
    setCompletedSession(sessionUsers.filter((session) => !session.is_active));
  }, [sessionUsers]);

  return (
    <div className="flex-col gap-2 flex-[3] h-[96%]">
        <div className="flex-col ml-2 mb-2 h-14">
          <p className="text-2xl text-white font-bold pl-2">Agent Insights</p>
          <p className="text-m text-right text-white font-bold pr-2">Powered by watsonx</p>
        </div>

      <div className="flex flex-col h-[32%] overflow-auto border border-blueGray-700 rounded-md mb-2 bg-white">
        <div className="flex w-full items-center h-14 gap-2 px-2 rounded-md bg-gray-50 ">
          <div className="w-5 h-5 rounded-full border-2 border-green-500"></div>
          <h4 className="text-[18px] font-medium tracking-wide text-black-500">
            Active sessions
          </h4>
        </div>
        <div className="h-full">
          <Accordion allowToggle>
            {activeSession.map((session) => (
              <SessionUser key={session.session_id} session={session} />
            ))}
          </Accordion>
        </div>
      </div>

      <div className="flex flex-col h-[68%] overflow-auto border border-blueGray-700 rounded-md bg-white">
        <div className="flex w-full items-center h-14 gap-2 px-2 rounded-md bg-gray-50">
          <div className="w-5 h-5 rounded-full border-2 border-red-500"></div>
          <h4 className="text-[18px] font-medium tracking-wide text-black-500">
            Ended sessions
          </h4>
        </div>
        <div className="h-full">
          <Accordion allowToggle>
            {completedSession.map((session) => (
              <SessionUser key={session.session_id} session={session} />
            ))}
          </Accordion>
        </div>      
      </div>
    </div>
  );
};

export default SessionBar;
