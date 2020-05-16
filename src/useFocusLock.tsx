import * as React from "react";

type EnabledCallback = (enabled: boolean) => unknown;
type StackEntry = { uid: string; isEnabled: boolean; setEnabled: EnabledCallback };

class LockStack {
  stack: StackEntry[] = [];
  listeners = new Set<EnabledCallback>();
  active = false;

  add(uid: string, setEnabled: EnabledCallback) {
    const current = this.current();
    if (current != null) this.toggleLayer(current, false);
    const newLayer = { uid, setEnabled, isEnabled: true };
    this.stack.push(newLayer);
    this.toggleLayer(newLayer, true);
    this.emit();
  }

  remove(uid: string) {
    const removed = this.stack.find((lock) => lock.uid === uid);
    const oldCurrent = this.current();
    // If the layer was currently the active one, mark it disabled before removing.
    if (removed != null && removed === oldCurrent) {
      this.toggleLayer(removed, false);
    }

    this.stack = this.stack.filter((lock) => lock.uid !== uid);

    // If a different layer is now the active one, mark it as enabled.
    const newCurrent = this.current();
    if (newCurrent != null && newCurrent !== oldCurrent) {
      this.toggleLayer(newCurrent, true);
    }
    this.emit();
  }

  current(): StackEntry | undefined {
    return this.stack[this.stack.length - 1];
  }

  isActive(uid: string) {
    const current = this.current();
    return current != null && current.uid === uid;
  }

  subscribe(callback: EnabledCallback) {
    this.listeners.add(callback);
  }

  unsubscribe(callback: EnabledCallback) {
    this.listeners.delete(callback);
  }

  emit() {
    const isActive = this.current() != null;
    if (isActive !== this.active) {
      this.listeners.forEach((callback) => callback(isActive));
      this.active = isActive;
    }
  }

  toggleLayer(layer: StackEntry, enabled: boolean) {
    layer.setEnabled(enabled);
    layer.isEnabled = enabled;
  }
}

// This global ensures that only one stack exists in the document. Having multiple
// active stacks does not make sense, as documents are only capable of having one
// activeElement at a time.
export const LOCK_STACK = new LockStack();

let lockCount = 0;
function newLockUID() {
  return `lock-${lockCount++}`;
}

export function useLockSubscription(callback: EnabledCallback) {
  React.useEffect(() => {
    LOCK_STACK.subscribe(callback);
    return () => LOCK_STACK.unsubscribe(callback);
  }, [callback]);
}

function createFocusWalker(root: HTMLElement) {
  return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: HTMLElement) =>
      // `.tabIndex` is not the same as the `tabindex` attribute. It works on the
      // runtime's understanding of tabbability, so this automatically accounts
      // for any kind of element that could be tabbed to.
      node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
  });
}

function wrapFocus(root: HTMLElement, target: Element, previousElement?: Element | null) {
  const walker = createFocusWalker(root);
  const position = target.compareDocumentPosition(root);
  let wrappedTarget = null;

  // previousElement would be null if a) there wasn't an element focused before
  // or b) focus came into the document from outside. In either case, it can be
  // treated as a reset point to bring focus back into the layer.
  if (position & Node.DOCUMENT_POSITION_PRECEDING || previousElement == null) {
    wrappedTarget = walker.firstChild() as HTMLElement | null;
  } else if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    wrappedTarget = walker.lastChild() as HTMLElement | null;
  }

  wrappedTarget != null && wrappedTarget.focus();
}

export function useFocusReturn(returnTo?: React.RefObject<HTMLElement>) {
  const [focusedOnMount] = React.useState(() => document.activeElement);

  React.useLayoutEffect(() => {
    return () => {
      // Specifically want the actual current value when this hook is cleaning up.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const target = returnTo != null ? returnTo.current : focusedOnMount;
      // Happens on next tick to ensure it is not overwritten by focus lock.
      Promise.resolve().then(() => {
        // TODO: how is this typeable? `Element` doesn't implement `focus`
        // @ts-ignore
        target != null && target.focus != null && target.focus();
      });
    };
    // Explicitly only want this to run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useLockLayer(controlledUID?: string) {
  const [uid] = React.useState(() => controlledUID || newLockUID());
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    LOCK_STACK.add(uid, setEnabled);
    return () => LOCK_STACK.remove(uid);
  }, [uid]);

  return enabled;
}

export function useFocusLock(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    returnRef?: React.RefObject<HTMLElement>;
    attachTo?: HTMLElement | Document;
  } = {},
) {
  const { returnRef, attachTo = document } = options;

  const enabled = useLockLayer();
  useFocusReturn(returnRef);

  React.useLayoutEffect(() => {
    if (!enabled) return;

    function handleFocusIn(event: FocusEvent) {
      const root = containerRef.current;
      if (root == null) return;

      const newFocusElement = (event.target as Element | null) || document.body;
      const prevFocusElement = event.relatedTarget as Element | null;

      if (!root.contains(newFocusElement)) {
        event.preventDefault();
        wrapFocus(root, newFocusElement, prevFocusElement);
      }
    }

    attachTo.addEventListener("focusin", handleFocusIn as EventListener, { capture: true });
    return () =>
      attachTo.removeEventListener("focusin", handleFocusIn as EventListener, { capture: true });
  }, [containerRef, enabled]);

  React.useLayoutEffect(() => {
    if (containerRef.current != null && !containerRef.current.contains(document.activeElement)) {
      containerRef.current.focus();
    }
  });
}

export default useFocusLock;

export const FocusGuard = React.memo(() => {
  const [active, setActive] = React.useState(false);
  useLockSubscription(setActive);

  return (
    <div
      tabIndex={active ? 0 : undefined}
      style={{ position: "fixed", opacity: 0, pointerEvents: "none" }}
    />
  );
});
