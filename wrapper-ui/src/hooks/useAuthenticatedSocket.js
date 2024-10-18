import { useSocket } from "socket.io-react-hook";
//import { useOidcConfig } from 'utils/oidcProvider'
export const useAuthenticatedSocket = (namespace) => {
    //const { appIDConfigured, accessToken } = useOidcConfig();
    // Manipulate enabled option based on OIDC configuration and access token
   // console.log(`socketio - oidc ${appIDConfigured} at ${accessToken}`)
    //   console.log(getAccessToken())
    // expose  the useSocket returns here
    // we wait for appIDConfigured to turn from null to either true/false before enabling the connection
    // if appIDConfigured is true, we continue waiting until the accessToken becomes available (it is handled in the authProvider)
    const { socket, connected, error } = useSocket(namespace, {
       // enabled: appIDConfigured === true // && !!accessToken,
        //    auth: appIDConfigured === true ? { token: accessToken } : undefined
    });

    return { socket, connected, error };
};