# Focus Layers

Tiny React hooks for isolating focus within subsections of the DOM. Useful for supporting accessible
`dialog` widgets like modals, popouts, and alerts.

No wrapper components, no emulation, no pre-defined "list of tabbable elements", and no data
attributes. Implemented entirely with native APIs and events.

## Basic Usage

Call `useFocusLock` inside a component and provide it a ref to the DOM node to use as the container
for the focus layer. When the component mounts, it will lock focus to elements within that node, and
the lock will be released when the component unmounts.

```tsx
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

```tsx
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

```tsx
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

Layers are managed by a global `LOCK_STACK` object. You can subscribe to this stack to get updates
whenever any focus layers are active. This is useful for marking the rest of your app with
`aria-hidden` when modals are active, or performing any other tasks on demand:

```tsx
import {LOCK_STACK} from 'focus-layers';

function App() {
  const [focusLockActive, setFocusLockActive] = React.useState(false);
  React.useEffect(() => {
    LOCK_STACK.subscribe(setFocusLockActive);
    return () => LOCK_STACK.subscribe(setFocusLockActive);
  }, []);
  
  return (
    <React.Fragment>
      // This div represents your main app content
      <div aria-hidden={focusLockActive} />
      // This div would be where the dialog layers are rendered
      <div />
    </React.Fragment>
  );
}
```


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

```tsx
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

## External Focus Layers

The `LOCK_STACK` provides a way of integrating your own layers into the system. This can be useful
when integrating with other libraries or components that implement their own focus management, or
manually triggering focus locks that aren't tied to a component lifecycle.

Activating a layer is as simple as calling `add` with a `uid` and an `EnabledCallback`, which will be
called when the `LOCK_STACK` determines that the layer should be active. The callback will be invoked
immediately by the call to `add`, indicating that the layer is now active. The layer can then be
removed at any time in the future via the `remove` method.

```typescript
import {LOCK_STACK} from 'focus-layers';

const enabled = false;
const setEnabled = (now) => enabled = now;

LOCK_STACK.add("custom lock", setEnabled);
// Sometime later
LOCK_STACK.remove("custom lock");
```

Integrating with the `LOCK_STACK` is a promise that your lock will enable and disable itself when it
is told to (via the callback). Adding your lock to the stack is also a promise that you will remove
it from the stack once the lock is "unmounted" or otherwise removed from use. Without removing your
lock, all layers below your lock will be unable to regain focus.

If you are inside of a component and want to tie the focus lock to its lifecycle, you can instead use
the `useFocusLayer` hook to simplify adding and removing. In return it provides a boolean indicating
whether the lock is currently enabled, and will force a re-render when that state changes:

```typescript
import {useFocusLayer} from 'focus-layers';

function Component() {
  const enabled = useFocusLayer();
 
  React.useEffect(() => {
    toggleCustomLock(enabled);
  }, [enabled]);
 
  return <p>Custom lock is {enabled ? "enabled" : "disabled"}</p>;
}
```

## Free Focus Layers

Custom locks can also be used to implement "free focus layers" without losing the context of the
focus layers that are currently in place. Free focus is a situation where focus is not locked into
any subsection and can move freely throughout the document. This can be useful for single-page
applications that want to preserve focus state between mutiple views where previous views get
removed from the DOM while another view takes its place.

A free focus layer can easily be implemented as part of a Component. In the single-page application
use case mentioned above, this might happen in the base `View` component that wraps each view.

```typescript
import {useFocusLayer} from 'focus-layers';

function View() {
  useFocusLayer();
  
  return <div />;
}
```

The layer gets added on mount, disabling all layers below it, and since there's no new lock to
activate, the return value is just ignored, and nothing else needs to happen.

## Alternatives

This library was created after multiple attempts at using other focus locking libraries and wanting
something with a simpler implementation that leverages the browser's APIs as much as possible, and
fewer implications on DOM and Component structures. There are multiple other options out there that
perform a simlar job in different ways, such as:

- [react-focus-lock](https://github.com/theKashey/react-focus-lock): Lots of options, very flexible,
  but uses a lot of DOM nodes and attributes.
- [react-focus-trap](https://github.com/vigetlabs/react-focus-trap): Nice and simple, but uses two
  `div` containers and does not work nicely with `shift+tab` navigation.
- [focus-trap-react](https://github.com/davidtheclark/focus-trap-react): Lots of useful features,
  but relies on intercepting key and mouse events and querying for tabbable elements.
