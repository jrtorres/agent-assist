

import {EnvVarsProvider} from "@client/providers/EnvVars";
import { IoProvider } from 'socket.io-react-hook';

export const AppProvider = (props: any) => (
  <EnvVarsProvider><IoProvider>{props.children}</IoProvider></EnvVarsProvider>
);