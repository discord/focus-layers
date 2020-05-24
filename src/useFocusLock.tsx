import * as React from "react";

import LockStack, { LockListener } from "./LockStack";
import wrapFocus from "./util/wrapFocus";

// This global ensures that only one stack exists in the document. Having multiple
// active stacks does not make sense, as documents are only capable of having one
// activeElement at a time.
export const LOCK_STACK = new LockStack();

let lockCount = 0;
function newLockUID() {
  return `lock-${lockCount++}`;
}

/**
 * Creates a subscription to the lock stack that is bound to the lifetime
 * of the caller, based on `useEffect`.
 */
export function useLockSubscription(callback: LockListener) {
  // `subscribe` returns an `unsubscribe` function that `useEffect` can invoke
  // to clean up the subscription.
  React.useEffect(() => LOCK_STACK.subscribe(callback), [callback]);
}

/**
 * Set up a return of focus to the target element specified by `returnTo` to
 * occur at the end of the lifetime of the caller component. In other words,
 * return focus to where it was before the caller component was mounted.
 */
export function useFocusReturn(
  returnTo?: React.RefObject<HTMLElement>,
  enabledRef?: React.RefObject<boolean>,
) {
  const [focusedOnMount] = React.useState(() => document.activeElement);

  React.useLayoutEffect(() => {
    return () => {
      if (enabledRef != null && !enabledRef.current) return;

      // Specifically want the actual current value when this hook is cleaning up.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const target = returnTo != null ? returnTo.current : focusedOnMount;
      // Happens on next tick to ensure it is not overwritten by focus lock.
      Promise.resolve().then(() => {
        // TODO: how is this typeable? `Element` doesn't implement `focus`
        // @ts-ignore
        target?.focus?.();
      });
    };
    // Explicitly only want this to run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Create and push a new lock onto the global LOCK_STACK, tied to the lifetime
 * of the caller. Returns a ref containing the current enabled state of the
 * layer, to be used for enabling/disabling the caller's lock logic.
 */
export function useLockLayer(controlledUID?: string) {
  const [uid] = React.useState(() => controlledUID || newLockUID());
  const enabledRef = React.useRef(false);

  React.useLayoutEffect(() => {
    LOCK_STACK.add(uid, (enabled) => (enabledRef.current = enabled));
    return () => LOCK_STACK.remove(uid);
  }, [uid]);

  return enabledRef;
}

export default function useFocusLock(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    returnRef?: React.RefObject<HTMLElement>;
    attachTo?: HTMLElement | Document;
    disable?: boolean;
  } = {},
) {
  const { returnRef, attachTo = document, disable } = options;
  // Create a new layer for this lock to occupy
  const enabledRef = useLockLayer();

  // Allow the caller to override the lock and force it to be disabled.
  React.useEffect(() => {
    if (!disable) return;
    enabledRef.current = false;
  }, [disable]);

  // Add the
  React.useLayoutEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      if (!enabledRef.current) return;

      const root = containerRef.current;
      if (root == null) return;

      const newFocusElement = (event.target as Element | null) || document.body;
      if (root.contains(newFocusElement)) return;

      event.preventDefault();
      wrapFocus(root, newFocusElement);
    }

    attachTo.addEventListener("focusin", handleFocusIn as EventListener, { capture: true });
    return () => {
      attachTo.removeEventListener("focusin", handleFocusIn as EventListener, { capture: true });
    };
  }, [containerRef]);

  // Move focus into the container if it is not already, or if an element
  // inside of the container will automatically receive focus, it won't be moved.
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (
      container != null &&
      !container.contains(document.activeElement) &&
      container.querySelector("[autofocus]") == null
    ) {
      container.focus();
    }
  }, []);

  // Set up a focus return after the container is unmounted.
  useFocusReturn(returnRef, enabledRef);
}

/**
 * A convenience component for rendering "guard elements" that ensure there is
 * always a tabbable element either before or after (or both) an active lock.
 * These are most easily rendered right at the edges of the React rendering root
 * so that all locks can utilize the same guards.
 *
 * When no lock is active, `FocusGuard` is completely invisible, both visually
 * and in the focus order. When active, it gets a tabindex, but always remains
 * visually hidden.
 */
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
