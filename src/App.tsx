import * as React from "react";

import useFocusLock, { FocusGuard } from "./useFocusLock";

import "./App.mod.css";

type DialogProps = {
  children: React.ReactNode;
};
function Dialog({ children }: DialogProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  useFocusLock(containerRef);

  return (
    <div className="dialog" ref={containerRef} tabIndex={-1} aria-modal="true">
      {children}
    </div>
  );
}

function SimpleExample() {
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

function NestedExample() {
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

function DistributedExample() {
  return (
    <div>
      <h1>Distributed Groups</h1>

      <p>
        Layers with multiple, unconnected container nodes are not currently supported. This means
        layers that have content <em>and</em> render a React Portal as part of the layer may not
        allow focus to leave the layer and reach the portal.
      </p>

      <p>
        Rendering a layer entirely <em>within</em> a Portal, or by any other means where there is a
        single containing node, is supported.
      </p>

      <p>
        Support for groups may be added in the future to address this issue. However, it's worth
        noting that Portals already do not play well with tab orders and should generally not be
        used as anything other than an isolated focus layer. Otherwise the entire premise that focus
        is locked into the layer is effectively broken anyway.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div className="container">
      <FocusGuard />

      <p>
        Focus lock without any extraneous divs or data properties, using <code>Range</code>
        {", "}
        <code>TreeWalker</code>, and native focus events.
      </p>

      <SimpleExample />
      <NestedExample />
      <DistributedExample />

      <h1>Edge Guards</h1>

      <p>
        Browsers do not provide a clean way of intercepting focus events that cause focus to leave
        the DOM. Specifically, there is no way to directly prevent a tab/shift-tab action from
        moving focus to the browser's controls.
      </p>

      <p>
        This can cause issues with focus isolation at the edges of the DOM, where there are no more
        tabbable elements past the focus lock layer for focus to move to before exiting the DOM.
      </p>

      <p>
        Semantically, this is valid behavior, but it is often nice to ensure that focus is still
        locked consistently. The solution is to add divs with <code>tabindex="0"</code> to the
        beginning and end of the DOM (or around the focus layer) so that there is always another
        element for focus to move to while inside of a focus layer. Remember that this is not{" "}
        <em>semantically required</em> behavior, adding these elements is optional.
      </p>

      <p>
        This library provides a <code>FocusGuard</code> component that you can render which will
        automatically activate when any focus layer is active, and hide itself otherwise. It renders
        a div that is always visually hidden, but becomes tabbable when active.
      </p>

      <FocusGuard />
    </div>
  );
}
