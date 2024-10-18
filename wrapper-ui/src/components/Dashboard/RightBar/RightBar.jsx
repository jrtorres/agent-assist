import Conversation from "../Conversation/Conversation";
import SentimentProgress from "../SentimentProgress/SentimentProgress";

const RightBar = () => {
  return (
    <div className="flex flex-col overflow-hidden h-[98%] gap-2 relative">
      <div className="h-3/5">
        <Conversation />
      </div>
      <div className="h-2/5 mb-1 mt-2">
        <SentimentProgress />
      </div>
    </div>
  );
};

export default RightBar;
