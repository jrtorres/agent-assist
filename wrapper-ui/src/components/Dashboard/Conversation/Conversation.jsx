import {useContext, useEffect, useRef} from "react";
import {AppContext} from "../../../context/context";
import Message from "./Message/Message";

const Conversation = () => {
  const {currentSessionUser, conversations} = useContext(AppContext);
  // Ref for the scrollable area
  const scrollableAreaRef = useRef(null);

  useEffect(() => {
    // Scrolls to the bottom of the scrollable area
    if (scrollableAreaRef.current) {
      scrollableAreaRef.current.scrollTop =
        scrollableAreaRef.current.scrollHeight;
    }
  }, [conversations]);

  return (
    // <div className="h-[90%] w-full flex flex-col"> without sentiment
    <div
      className="h-full w-full flex flex-col border border-blueGray-700 rounded-md shadow-sm mt-2 mr-1 mb-2 p-2 bg-white">
      <p className="text-[20px] ml-3 mb-3 pb-3 border-b border-gray-100 font-semibold">
        Conversation
      </p>
      {/*<div className="p-4 border-b border-gray-200 mb-4">
        <p className="text-[20px] font-semibold">Conversation</p>
      </div>*/}
      <div className="overflow-auto flex-grow" ref={scrollableAreaRef}>
        {currentSessionUser ? (
          conversations
            .filter((msg) => msg.session_id === currentSessionUser.session_id)
            .map((message, index) => (
              <Message key={`${message.session_id}-${index}`} data={message}/>
            ))
        ) : null}
      </div>
    </div>
  );
};

export default Conversation;
