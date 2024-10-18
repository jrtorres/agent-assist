import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import { useContext } from "react";
import { AppContext } from "../../../context/context";
import { sentimentIcons } from "../../../utils/data";
import React from 'react'; 
import { differenceInMinutes, parseISO, format } from 'date-fns'; 

const calculateCallDuration = (startTime, endTime) => {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  return differenceInMinutes(end, start);
};

const formatDate = (dateString) => {
  const date = parseISO(dateString);
  return format(date, 'PPP'); // e.g., Mar 13, 2024
};

const SessionUser = ({ session }) => {
  const { dispatch } = useContext(AppContext);

  const handleClick = () => {
    dispatch({ type: "AddCurrentSessionUser", payload: session });
  };
  // console.log("SESSION DETAILS:");
  // console.log(session);
  const callDuration = session.time_ended ? calculateCallDuration(session.time_started, session.time_ended) : null;
  const callDate = session.time_ended ? formatDate(session.time_started) : null;

  return (
    <AccordionItem onClick={handleClick} className=" w-full shadow-sm">
      <h2>
        <AccordionButton height={"70px"}>
          <Box as="span" flex="1" textAlign="left" className="text-slate-500">
            {session?.phone} {session.is_active ? '' : ` - ${callDate} (${callDuration} mins)`}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        <div className="text-slate-500 h-10 tracking-wide">
          Caller ID : {session.caller_id}
        </div>
        <div className="text-slate-500 h-10 tracking-wide">
          DID : {session.DID}
        </div>
        <div className=" flex items-center gap-2 text-slate-500 h-10 tracking-wide">
          <p>Sentiment </p>{" "}
          <img
            width={"25px"}
            height={"25px"}
            src={sentimentIcons[session?.sentiment]}
            alt=""
          />
        </div>
        <div></div>
      </AccordionPanel>
    </AccordionItem>
  );
};

export default SessionUser;
SessionUser.propTypes = {
  session: PropTypes.any,
};
