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
  returnRef?: React.RefObject<HTMLElement>,
  disabledRef?: React.RefObject<boolean>,
) {
  // This isn't necessarily safe, but realistically it's sufficient.
  const [target] = React.useState(() => document.activeElement as HTMLElement);

  React.useLayoutEffect(() => {
    return () => {
      if (disabledRef != null && disabledRef.current) return;
      // Happens on next tick to ensure it is not overwritten by focus lock.
      requestAnimationFrame(() => {
        if (returnRef != null && returnRef.current != null) {
          returnRef.current.focus();
          return;
        }
        target != null && target.focus();
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

export type FocusLockOptions = {
  returnRef?: React.RefObject<HTMLElement>;
  disableReturnRef?: React.RefObject<boolean>;
  attachTo?: HTMLElement | Document;
  disable?: boolean;
};

export default function useFocusLock(
  containerRef: React.RefObject<HTMLElement>,
  options: FocusLockOptions = {},
) {
  const { returnRef, disableReturnRef, attachTo = document, disable } = options;
  // Create a new layer for this lock to occupy
  const enabledRef = useLockLayer();

  // Allow the caller to override the lock and force it to be disabled.
  React.useEffect(() => {
    if (!disable) return;
    enabledRef.current = false;
  }, [disable]);

  // Apply the actual lock logic to the container.
  React.useLayoutEffect(() => {
    // Move focus into the container if it is not already, or if an element
    // inside of the container will automatically receive focus, it won't be moved.
    const container = containerRef.current;
    if (
      container != null &&
      document.activeElement != null &&
      !container.contains(document.activeElement) &&
      container.querySelector("[autofocus]") == null
    ) {
      wrapFocus(container, document.activeElement, true);
    }

    function handleFocusIn(event: FocusEvent) {
      // This is scheduled for later to avoid problems when a new layer is being
      // added on top of another. If the new layer has an `autoFocus` element, React
      // will perform that focus before the previous layer's lock has been disabled,
      // meaning focus will not be moved, and the new layer will just place focus on
      // the first tabbable element, making the `autoFocus` appear broken. Waiting
      // ensures that this layer will be disabled before attempting to intercept the
      // autoFocus event.
      requestAnimationFrame(() => {
        if (!enabledRef.current) return;

        const root = containerRef.current;
        if (root == null) return;

        const newFocusElement = (event.target as Element | null) || document.body;
        if (root.contains(newFocusElement)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        wrapFocus(root, newFocusElement);
      });
    }

    function handleFocusOut(event: FocusEvent) {
      if (!enabledRef.current) return;

      const root = containerRef.current;
      if (root == null) return;

      if (event.relatedTarget == null || event.relatedTarget === document.body) {
        event.preventDefault();
        root.focus();
      }

      const newFocusElement = (event.target as Element | null) || document.body;
      if (root.contains(newFocusElement)) return;

      wrapFocus(root, newFocusElement);
    }

    attachTo.addEventListener("focusin", handleFocusIn as EventListener, { capture: true });
    attachTo.addEventListener("focusout", handleFocusOut as EventListener, { capture: true });
    return () => {
      attachTo.removeEventListener("focusin", handleFocusIn as EventListener, { capture: true });
      attachTo.removeEventListener("focusout", handleFocusOut as EventListener, { capture: true });
    };
  }, [containerRef]);

  // Set up a focus return after the container is unmounted.
  // This happens at the end to absolutely ensure that the return is the last
  // thing that will run as part of this hook (i.e., that the focus handlers
  // have been fully detached).
  useFocusReturn(returnRef, disableReturnRef);
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
