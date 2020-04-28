import * as React from "react";
import { render } from "react-dom";

import { FocusGuard } from "../src/useFocusLock";

import SimpleExample from "./SimpleExample";
import LayeringExample from "./LayeringExample";
import FreeFocusToggleExample from "./FreeFocusToggleExample";
import SubscriptionExample from "./SubscriptionExample";

function Index() {
  return (
    <div>
      <FocusGuard />

      <p>
        This page shows a few ways that <code>focus-layers</code> can be used. This page also
        includes the <code>FocusGuard</code> components at the edges to show how they can restrict
        focus. The focus ring has also been overridden to make it more obvious where focus currently
        resides on the page at any given time.
      </p>

      <SimpleExample />
      <LayeringExample />
      <FreeFocusToggleExample />
      <SubscriptionExample />

      <FocusGuard />
    </div>
  );
}

render(<Index />, document.getElementById("root"));
