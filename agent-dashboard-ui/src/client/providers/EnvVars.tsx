

import {createContext, useContext, useEffect, useState} from "react";
import {WidgetConfigT} from "../../@types/widget";

export interface EnvVars {
    widgetConfig: WidgetConfigT,
    socketPort: number,
    waIntegrationId: string,
    waRegion: string,
    waServiceInstanceId: string
}

const EnvVarsContext = createContext({});

export const EnvVarsProvider = (props: any) => {
    const [envVars, setEnvVars] = useState({});

    useEffect(() => {
        fetch('api/environment')
            .then((response) => response.json())
            .then((data) => {
                setEnvVars(data);
            }).catch(err => err)
    }, [])

    return <EnvVarsContext.Provider value={envVars}>{props.children}</EnvVarsContext.Provider>;
}

export const useEnvVars = () => useContext(EnvVarsContext);
