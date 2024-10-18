import { useContext } from "react";
import { IoSettingsOutline } from "react-icons/io5";
import { AppContext } from "../../../context/context";
import { SettingModal } from "../../Modal/Setting/SettingModal";

const ActiveSessionBar = () => {
  const { currentSessionUser } = useContext(AppContext);

  return (
    <div className="flex justify-self-start items-center h-[97%] border border-blueGray-700 rounded-md p-2 bg-white">
      {currentSessionUser ? (
        <>
          <div
            className={` ${
              currentSessionUser?.is_active ? "bg-green-500" : " bg-red-600"
            }  w-3 h-3 rounded-full`}
          ></div>
          
          <div className="w-2"></div>

          <p
            className={` tracking-wide ${
              currentSessionUser?.is_active
                ? "text-gray-800"
                : " text-gray-500"
            } `}
          >
            Observing call with {currentSessionUser?.phone}
          </p>
        </>
      ) : (
        <p className="text-slate-500 text-[15px]">No session selected </p>
      )}
    </div>
  );
};



export default ActiveSessionBar;
