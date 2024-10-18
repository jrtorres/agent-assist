import TopBar from "../../components/Dashboard/TopBar/TopBar";
import MiddleBox from "../../components/Dashboard/MiddleBox/MiddleBox";
import RightBar from "../../components/Dashboard/RightBar/RightBar";
import SessionBar from "../../components/Dashboard/SessionBar/SessionBar";

const Dashboard = () => {
  return (
    <div className="flex w-full h-[98%]">
      <SessionBar />
      <div className="flex-col flex-[9]">
        <div>
          <TopBar />
        </div>
        <div className="flex h-full overflow-hidden">
          <div className="w-2/3 mb-2">
            <MiddleBox />
          </div>
          <div className="w-1/3">
            <RightBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
