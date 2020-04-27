import React from "react";
import { render } from "react-dom";

import { FocusGuard } from "../src/useFocusLock";

import SimpleExample from "./SimpleExample";
import NestedExample from "./NestedExample";
import DistributedExample from "./DistributedExample";

render(
  <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "auto", lineHeight: 1.4 }}>
    <FocusGuard />

    <p>
      Here are a few examples of using focus layers. This page also includes <code>FocusGuard</code>
      components at the edges to show how they can restrict focus entirely within an application's
      content and away from the browser's controls.
    </p>

    <SimpleExample />
    <NestedExample />
    <DistributedExample />

    <FocusGuard />
  </div>,
  document.getElementById("root"),
);
