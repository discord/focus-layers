# Focus Layers

Tiny React hooks for isolating focus within subsections of the DOM. Useful for supporting accessible
`dialog` widgets like modals, popouts, and alerts.

No wrapper components, no emulation, no pre-defined "list of tabbable elements", and no data
attributes. Implemented entirely with native APIs and events.

## Basic Usage

Call `useFocusLock` inside a component and provide it a ref to the DOM node to use as the container
for the focus layer. When the component mounts, it will lock focus to elements within that node, and
the lock will be released when the component unmounts.

```typescript
import useFocusLock from "focus-layers";

function Dialog({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLElement>();
  useFocusLock(containerRef);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
}

function App() {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Show Dialog</button>
      {open && (
        <Dialog>
          <p>
            When this dialog is open, focus is trapped inside! Tabbing will always bring focus back
            to this button.
          </p>
          <button onClick={() => setOpen(false)}>Close Dialog</button>
        </Dialog>
      )}
    </div>
  );
}
```

## Returning Focus

After unmounting, locks will return focus to the element that was focused when the lock was mounted.
This return target can also be controlled by the second parameter of `useFocusLock`.

```typescript
function DialogWithExplicitReturn() {
  const [open, setOpen] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>();
  const returnRef = React.useRef<HTMLButtonElement>();
  useFocusLock(containerRef, returnRef);

  return (
    <React.Fragment>
      <button ref={returnRef}>Focus will be returned here</button>
      <button onClick={() => setOpen(true)}>Even though this button opens the Dialog</button>
      {open && (
        <Dialog>
          <button onClick={() => setOpen(false)}>Close Dialog</button>
        </Dialog>
      )}
    </React.Fragment>
  );
}
```

## Lock Layers

Locks Layers are quite literally layers of locks, meaning they can be stacked on top of each other
to create a chain of focus traps. When the top layer unmounts, the layer below it takes over as the
active lock. Layers can be removed in any order, and the top layer will always remain active.

This is useful for implementing confirmations inside of modals, or flows between multiple
independent modals, where one dialog will open another, and so on.

```typescript
function LayeredDialogs() {
  const [firstOpen, setFirstOpen] = React.useState(false);
  const [secondOpen, setSecondOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setFirstOpen(true)}>Open First Dialog</button>

      {firstOpen && (
        <Dialog>
          <p>This is the first dialog that has a second confirmation after it.</p>
          <button onClick={() => setSecondOpen(true)}>Confirm</button>
        </Dialog>
      )}

      {secondOpen && (
        <Dialog>
          <p>This is the second dialog, opened by the first one.</p>
          <button onClick={() => setSecondOpen(false)}>Confirm this dialog</button>
          <button
            onClick={() => {
              setSecondOpen(false);
              setFirstOpen(false);
            }}>
            Close both dialogs
          </button>
        </Dialog>
      )}
    </div>
  );
}
```

Note that layers only track their own return targets. If multiple layers are unmounting, it is not
always guaranteed that the original return target will be focused afterward. In this case, it is
best to provide an explicit return target so that focus is not left ambiguous after unmounting.

## Edge Guards

Browsers do not provide a clean way of intercepting focus events that cause focus to leave the DOM.
Specifically, there is no way to directly prevent a tab/shift-tab action from moving focus out of
the document and onto the browser's controls or another window.

This can cause issues with focus isolation at the edges of the DOM, where there are no more tabbable
elements past the focus lock layer for focus to move to before exiting the DOM.

Semantically, this is valid behavior, but it is often nice to ensure that focus is still locked
consistently. The solution is to add hidden divs with `tabindex="0"` to the beginning and end of the
DOM (or around the focus layer) so that there is always another element for focus to move to while
inside of a focus layer.

This library provides a `FocusGuard` component that you can render which will automatically activate
when any focus layer is active, and hide itself otherwise. It renders a div that is always visually
hidden, but becomes tabbable when active. These can be added at the actual edges of the DOM, or just
directly surrounding any active focus layers.

```typescript
import { FocusGuard } from "focus-layers";

function App() {
  return (
    <div id="app-root">
      <FocusGuard />
      // Render the rest of your app or your modal layers here.
      <FocusGuard />
    </div>
  );
}
```

Focus will still be trapped even without these guards in place, but the user will be able to tab out
of the page and onto their browser controls if the layer is at either the very beginning or very end
of the document's tab order.

## Distributed Focus Groups

Layers with multiple, unconnected container nodes are not currently supported. This means layers
that have content and render a React Portal as part of the layer may not allow focus to leave the
layer and reach the portal.

Rendering a layer entirely within a Portal, or by any other means where there is a single containing
node, is supported.

Support for groups may be added in the future to address this issue. However, it's worth noting that
Portals already do not play well with tab orders and should generally not be used as anything other
than an isolated focus layer. Otherwise the entire premise that focus is locked into the layer is
effectively broken anyway.

## Alternatives

This library was created after multiple attempts at using other focus locking libraries and wanting
something with a simpler implementation that leverages the browser's APIs as much as possible. There
are multiple other options out there that do a simlar job in different ways, such as:

- [react-focus-lock](https://github.com/theKashey/react-focus-lock): Lots of options, very flexible,
  but uses a lot of DOM nodes and attributes.
- [react-focus-trap](https://github.com/vigetlabs/react-focus-trap): Nice and simple, but uses two
  `div` containers and does not work nicely with `shift+tab` navigation.
- [focus-trap-react](https://github.com/davidtheclark/focus-trap-react): Lots of useful features,
  but relies on intercepting key and mouse events and querying for tabbable elements.
