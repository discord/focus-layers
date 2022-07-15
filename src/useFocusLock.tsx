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
      if (returnRef != null && returnRef.current != null) {
        returnRef.current.focus();
        return;
      }
      target != null && target.focus();
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
  // When first created, immediately disable the current layer (the one below
  // this new one) to prevent its handlers from stealing focus back when this
  // layer mounts. Specifically, this allows `autoFocus` to work, since React
  // will perform the autofocus before any effects have run.
  const [] = React.useState(() => LOCK_STACK.toggleLayer(LOCK_STACK.current(), false));

  React.useLayoutEffect(() => {
    LOCK_STACK.add(uid, (enabled) => (enabledRef.current = enabled));
    return () => LOCK_STACK.remove(uid);
  }, [uid]);

  return enabledRef;
}

export type FocusLockOptions = {
  returnRef?: React.RefObject<HTMLElement>;
  disableReturnRef?: React.RefObject<boolean>;
  attachToRef?: React.RefObject<HTMLElement | Document>;
  disable?: boolean;
};

export function useFocusLock(
  containerRef: React.RefObject<HTMLElement>,
  options: FocusLockOptions = {},
) {
  const { returnRef, disableReturnRef, attachToRef = containerRef, disable } = options;
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
      if (!enabledRef.current) return;

      const root = containerRef.current;
      if (root == null) return;

      const newFocusElement = (event.target as Element | null) || document.body;
      if (root.contains(newFocusElement)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      wrapFocus(root, newFocusElement);
    }

    function handleFocusOut(event: FocusEvent) {
      if (!enabledRef.current) return;

      const root = containerRef.current;
      if (root == null) return;

      const newFocusElement =
        (event.relatedTarget as Element | null) || document.activeElement || document.body;
      if (event.relatedTarget === document.body) {
        event.preventDefault();
        root.focus();
      }

      if (root.contains(newFocusElement)) return;

      wrapFocus(root, newFocusElement);
    }

    const attachTo = attachToRef.current;
    if (attachTo == null) return;

    attachTo.addEventListener("focusin", handleFocusIn as EventListener, { capture: true });
    attachTo.addEventListener("focusout", handleFocusOut as EventListener, { capture: true });
    return () => {
      attachTo.removeEventListener("focusin", handleFocusIn as EventListener, { capture: true });
      attachTo.removeEventListener("focusout", handleFocusOut as EventListener, { capture: true });
    };
  }, [containerRef, attachToRef]);

  // Set up a focus return after the container is unmounted.
  // This happens at the end to absolutely ensure that the return is the last
  // thing that will run as part of this hook (i.e., that the focus handlers
  // have been fully detached).
  useFocusReturn(returnRef, disableReturnRef);
}

export default useFocusLock;

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
