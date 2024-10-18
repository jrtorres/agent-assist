

import * as React from "react";
import * as ReactDOM from "react-dom";
import {createRoot} from "react-dom/client";
import App from './components/App/App';

import "./i18n";
import "./index.scss";

let promise = Promise.resolve();

if (process.env.NODE_ENV !== "production") {
  const axe = require("@axe-core/react");
  promise.then(axe.default(React, ReactDOM, 1000));
}

promise.finally(() => {
    let rootElem = document.getElementById("root") as HTMLElement;
    const root = createRoot(rootElem);
    root.render(<App/>);
  }
);
