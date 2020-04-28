import * as React from "react";

import { LOCK_STACK } from "../src/useFocusLock";

import Dialog from "./Dialog";

export default function FreeFocusToggleExample() {
  const [open, setOpen] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const layerId = "freefocus";

    if (enabled) {
      LOCK_STACK.add(layerId, setEnabled);
    } else {
      LOCK_STACK.remove(layerId);
    }

    // This cleanup is important in case the dialog gets unmounted before the
    // toggle is disabled. Without it, the lock stack will get corrupted with
    // this layer blocking all of the layers below it.
    return () => LOCK_STACK.remove(layerId);
  }, [enabled]);

  return (
    <div>
      <h1>Free Focus Toggle</h1>

      <p>
        Free focus layers are layers in the lock stack that don't implement any locking behavior.
        This means that when they are added, focus locking is effectively disabled, since all layers
        beneath it will be disabled by the new layer above them.
      </p>

      <p>
        Open the dialog with the button below and see how focus is trapped within it. Then enable
        the Free Focus toggle and notice how focus is no longer locked.
      </p>

      <button onClick={() => setOpen(true)}>Open Free Focus Dialog</button>

      {open && (
        <Dialog>
          <p>
            Free focus is currently <strong>{enabled ? "enabled." : "disabled."}</strong>
          </p>

          <button>Button 1</button>
          <button>Button 2</button>
          <button onClick={() => setEnabled(!enabled)}>Toggle Free Focus</button>
          <button onClick={() => setOpen(false)}>Close dialog</button>
        </Dialog>
      )}
    </div>
  );
}
