import * as React from "react";

import { useLockSubscription } from "../src/useFocusLock";

import Dialog from "./Dialog";

export default function CustomLockExample() {
  const [enabled, setEnabled] = React.useState(false);
  useLockSubscription(setEnabled);

  return (
    <div>
      <h1>Lock Subscriptions</h1>

      <p>
        If you'd like to be notified whenever a focus lock is enabled or disabled, you can subscribe
        to the lock stack, either directly or through the <code>useLockSubscription</code> hook.
        This registers a callback that will be fired whenever the lock stack becomes active.
      </p>

      <p>
        As a simple visible example, this uses a subscription to change the color of a box whenever
        a focus layer is active.
      </p>

      {enabled ? (
        <p style={{ color: "green" }}>A lock is currently active.</p>
      ) : (
        <p style={{ color: "red" }}>No locks are currently active.</p>
      )}

      <p>
        Note that, currently, subscriptions are naive and unaware of "free focus" layers, meaning
        the enabled state given to the callback is not necessarily indicative of locked focus, but
        rather the presence of any lock layers. This may change in the future.
      </p>

      <p>
        Subscriptions are particularly useful when creating <code>dialog</code> widgets in
        compliance with the WAI ARIA spec. In these cases, it is common practice to mark everything
        outside of the dialog with the <code>aria-hidden</code> attribute. Because screenreaders
        often navigate by means other than moving DOM focus, this is how they can know that focus is
        meant to be trapped. The <code>aria-modal</code> attribute is a newer alternative that can
        mostly replace this practice, but support may vary.
      </p>
    </div>
  );
}
