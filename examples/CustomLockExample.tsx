import * as React from "react";

import { useLockLayer } from "../src/useFocusLock";

import Dialog from "./Dialog";

function OneButtonLock() {
  // `useLockLayer` takes care of adding and removing the layer from the lock
  // stack based on the lifecycle of the component, and returns a boolean
  // indicating whether the layer is currently enabled.
  const enabled = useLockLayer();
}

export default function CustomLockExample() {
  const [open, setOpen] = React.useState(false);

  const enabled = useLockLayer();

  return (
    <div>
      <h1>Custom Lock Layer</h1>

      <p>
        It's easy to integrate other focus management utilities with this library by creating custom
        lock layers for them. The <code>useLockLayer</code> hook takes care of everything and
        returns an <code>enabled</code> boolean that you can then use to control the state of those
        other utilities. Alternatively, if your custom locks are not tied to component lifecycles,
        you can manage adding and removing layers manually via the lock stack.
      </p>

      <button onClick={() => setOpen(true)}>Open Free Focus Dialog</button>

      {open && (
        <OneButtonLock>
          <p>
            Free focus is currently <strong>{enabled ? "enabled." : "disabled."}</strong>
          </p>

          <button autoFocus>Focusable button</button>
          <button>Button 2</button>
          <button onClick={() => setEnabled(!enabled)}>Toggle Free Focus</button>
          <button onClick={() => setOpen(false)}>Close dialog</button>
        </OneButtonLock>
      )}
    </div>
  );
}
