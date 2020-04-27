import * as React from "react";

import Dialog from "./Dialog";

export default function SimpleExample() {
  const [showDialog, setShowDialog] = React.useState(false);

  return (
    <div>
      <h1>Simple Example</h1>

      <p>
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      </p>

      <p>Clicking "Show Dialog" will open a dialog container and trap focus within it.</p>

      <div>
        <button onClick={() => setShowDialog(!showDialog)}>Show Dialog</button>
        {showDialog ? (
          <Dialog>
            <p>
              Showing this dialog traps focus within it. You can tab and click and do whatever, but
              focus will always remain inside this area. It also wraps around when you reach either
              end, as the ARIA spec prescribes.
            </p>
            <p>
              No focus emulation, no guard elements, no special properties, just raw event
              interception. Note that Tab order with positive tab indices is not preserved, but also
              you shouldn't be using positive tab indices anyway :eyes:
            </p>
            <div>
              <input type="text" />
              <a href="#linked">A link (not always tabbable)</a>
              <select>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
            <button>Button 4</button>
            <button autoFocus>Autofocused button</button>
            <button>Button 6</button>
            <div>
              <button onClick={() => setShowDialog(false)}>Close Dialog</button>
            </div>
          </Dialog>
        ) : null}
      </div>

      <p>
        <button>Button 7</button>
        <button>Button 8</button>
        <button>Button 9</button>
      </p>
    </div>
  );
}
