import {send} from "../../../libs/WAVStreamer";
import {togglePauseResume} from "../../../libs/WAVStreamer";
import React, { useState } from 'react';
import { useAgentId } from "../../../hooks/useAgentIdProvider";

const FileStreamer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const { agentId } = useAgentId()
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile){
      alert ('Please select a file first.');
      return;
    }

    const fileReader = new FileReader();

    // Set up event handlers for the FileReader
    fileReader.onload = function(event) {
      const fileData = event.target.result;
      send(fileData, agentId);
      setIsPlaying(!isPlaying);
      setAudioStarted(true);
    }

    // Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(selectedFile);
  }

  const togglePlayPause = () => {
    togglePauseResume();
    setIsPlaying(!isPlaying);  
  }

  return (
    <div className="flex items-center grid grid-cols-2 h-[97%] border border-blueGray-700 rounded-md p-2 bg-white">
      <div className="space-x-2">
        <progress id="progressBar" value="0" max="100"/>
        <button onClick={togglePlayPause} disabled={!audioStarted} style={{backgroundColor: isPlaying ? '#4caf50' : '#f44336',border: '1px solid black', borderRadius: '2px', cursor: 'pointer', padding: '2px 4px'}}>
          {isPlaying ? 'Pause' : ' Play'}   
        </button>
      </div>
      <div className="flex items-center">
        <input type="file" id="fileInput" name="fileInput" accept=".wav" onChange={handleFileChange}/>
      </div>
    </div>
  );
};


export default FileStreamer;
