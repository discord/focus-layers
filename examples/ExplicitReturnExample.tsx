import * as React from "react";

import Dialog from "./Dialog";

export default function ExplicitReturnExample() {
  const [open, setOpen] = React.useState(false);

  const returnRef = React.useRef<HTMLButtonElement>();

  return (
    <>
      <h1>Returning Focus</h1>
      <p>
        This example shows how focus can be returned to a different element than the one that was
        active when a layer was first activated. Note that if the provided target does not exist,
        the return will default back to the last active element.
      </p>
      <button onClick={() => setOpen(true)}>This button opens the Dialog</button>
      <button ref={returnRef}>But focus will be returned here</button>
      {open && (
        <Dialog returnRef={returnRef}>
          <button onClick={() => setOpen(false)}>Close Dialog</button>
        </Dialog>
      )}
    </>
  );
}
