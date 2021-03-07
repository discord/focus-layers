import * as React from "react";

import Dialog from "./Dialog";

export default function App() {
  const [open, setOpen] = React.useState(false);
  const [open2, setOpen2] = React.useState(false);

  return (
    <>
      <h1>Auto Focus</h1>
      <p>
        By default, the first tabbable element in a layer will receive focus. But if any element has
        an `autoFocus` attribute, it will be respected and that element will receive focus instead
        when the container mounts.
      </p>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      {open && (
        <Dialog>
          <button>This would normally get focused</button>
          <button onClick={() => setOpen2(true)}>Open Dialog 2</button>
          <input type="text" placeholder="But this has autofocus!" autoFocus />
          <button onClick={() => setOpen(false)}>Close Dialog</button>
        </Dialog>
      )}

      {open2 && (
        <Dialog>
          <button>This would normally get focused</button>
          <input type="text" placeholder="But this has autofocus!" autoFocus />
          <button onClick={() => setOpen2(false)}>Close Dialog</button>
        </Dialog>
      )}
    </>
  );
}
