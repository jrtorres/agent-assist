import ActiveSessionBar from "../ActiveSessionBar/ActiveSessionBar";
import FileStreamer from "../FileStreamer/FileStreamer";

const TopBar = () => {
  return (
    <div className="flex flex-row overflow-hidden h-14 relative">
        <div className="w-2/3 mr-2 ml-2">
          <ActiveSessionBar />
        </div>
        <div className="w-1/3">
          <FileStreamer />
        </div>
    </div>
  );
};

export default TopBar;
