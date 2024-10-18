import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create a context for managing the agent ID
const AgentIdContext = createContext();

// Custom hook for accessing the agent ID from the context
export const useAgentId = () => useContext(AgentIdContext);

// Agent ID provider component
export const AgentIdProvider = ({ children }) => {
    const [agentId, setAgentId] = useState(null);

    useEffect(() => {
        // Parse query parameters from the URL
        const queryParams = new URLSearchParams(window.location.search);
        const agentIdParam = queryParams.get('agent_id');

        if (agentIdParam) {
            // If "agent_id" query parameter is present, use its value
            setAgentId(agentIdParam);
        } else {
            // If "agent_id" parameter is not present, generate a UUID
            const newAgentId = uuidv4();
            setAgentId(newAgentId);
        }
    }, []);

    // Method for setting the agent ID
    const setAgentIdHandler = (newAgentId) => {
        setAgentId(newAgentId);
    };

    return (
        <AgentIdContext.Provider value={{ agentId, setAgentId: setAgentIdHandler }}>
            {children}
        </AgentIdContext.Provider>
    );
};

// this needs to be used in a provider!