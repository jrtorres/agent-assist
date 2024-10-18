import {useAgentId} from "../../../hooks/useAgentIdProvider.jsx";
import {Loading} from "@carbon/react"

const MiddleBox = () => {
  const {agentId} = useAgentId();
  if (agentId) {
    if (window.__APP_CONFIG__) {
      return (
        <div className="flex-[6] h-[98%] shadow-sm border border-[#94eaf7] rounded-md relative m-2 gap-2 bg-[#94eaf7]/85">
          <div className="flex flex-col h-full">
            <iframe src={`${window.__APP_CONFIG__.proxyPath}/?agent_id=${agentId}`} style={{height: "100%"}}></iframe>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex-[6] h-[98%] shadow-sm border border-[#94eaf7] rounded-md relative m-2 gap-2 bg-[#94eaf7]/85">
          <div className="flex flex-col h-full">
            <iframe src={`http://localhost:3000/?agent_id=${agentId}`} style={{height: "100%"}}></iframe>
          </div>
        </div>
      );
    }

  
  } else {
    return (<Loading />)
  }
};

export default MiddleBox;
