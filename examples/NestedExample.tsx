import * as React from "react";

import Dialog from "./Dialog";

export default function NestedExample() {
  const [showNestingDialog, setShowNestingDialog] = React.useState(false);
  const [showNestedDialog, setShowNestedDialog] = React.useState(false);
  const [showAdjacentDialog, setShowAdjacentDialog] = React.useState(false);

  return (
    <div>
      <h1>Lock Layers</h1>

      <p>
        Locks can be safely nested. Locks maintain a Stack-like context such that only the top-most
        lock is active at any given time. This means nested locks, portaled locks, and any other
        instances of layering are supported the same way. No tracking on the user side is necessary.
      </p>

      <p>
        Note that this is <em>not</em> the same as "distributed locks" where a single lock layer
        spans multiple nodes. Such behavior is not currently supported.
      </p>

      <button onClick={() => setShowNestingDialog(true)}>Show First Dialog</button>
      {showNestingDialog ? (
        <Dialog>
          <p>
            This dialog has some buttons and another dialog inside of it. Because it is all rendered
            inside of a single container node, this just works.
          </p>

          <p>
            <button>Dialog button 1</button>
            <button>Dialog button 2</button>
          </p>

          <p>
            <button onClick={() => setShowNestedDialog(true)}>Show Second Dialog</button>
            <button onClick={() => setShowAdjacentDialog(true)}>Show Adjacent Dialog</button>
          </p>

          {showNestedDialog ? (
            <Dialog>
              <p>This is the contained dialog, it locks focus within itself until it is closed.</p>
              <button>Nested button 1</button>
              <button>Nested button 2</button>
              <button onClick={() => setShowNestedDialog(false)}>Close Second Dialog</button>
            </Dialog>
          ) : null}

          <p>
            <button onClick={() => setShowNestingDialog(false)}>Close First Dialog</button>
          </p>
        </Dialog>
      ) : null}

      {showAdjacentDialog ? (
        <Dialog>
          <p>
            This dialog exists next to the first Dialog. It traps focus within itself, then returns
            focus to the first dialog when closed.
          </p>
          <button onClick={() => setShowAdjacentDialog(false)}>Close Adjacent Dialog</button>
        </Dialog>
      ) : null}
    </div>
  );
}
