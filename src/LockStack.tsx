/**
 * Structural representation of a lock layer.
 */
export type Lock = {
  /**
   * Friendly id for the lock. Must be unique at least across all active locks.
   */
  uid: string;
  /**
   * Representation of the current state of the lock. Only gets updated _after_
   * enable callbacks have been run.
   */
  enabled: boolean;
  /**
   * Callback for actually enabling/disabling the locking logic in the consumer.
   * This function _must_ immediately cause the logic to be enabled/disabled.
   * Using asynchronous logic can cause issues where two mutually-exclusive locks
   * may be active at the same time, causing an infinite loop of focus movement.
   */
  setEnabled: (enabled: boolean) => unknown;
};

/**
 * A callback meant to be invoked whenever the state of a lock stack changes.
 * The first argument, `enabled`, indicates the enabled state of the top lock
 * in the stack, and the second argument, `stack`, is a reference to that
 * stack itself.
 */
export type LockListener = (enabled: boolean, stack: Lock[]) => unknown;

/**
 * Simple stack-like structure representing a layer system for focus locks.
 *
 * The stack takes care of enabling and disabling layers as necessary when locks
 * are added or removed from the stack. In this way, it is guaranteed that only
 * the top lock in the stack will be enabled at any given time.
 *
 * The stack also provides a subscription interface for consumers to be notified
 * whenever the state of the stack changes.
 */
export default class LockStack {
  /**
   * The stack of currently-active locks. At any given time, only the lock at
   * the top of the stack should be enabled. Locks in the rest of the stack will
   * be re-enabled when all locks above it are removed.
   */
  private locks: Lock[] = [];
  /**
   * List of listeners that will be notified whenever the state of the lock tree
   * is updated.
   */
  private listeners: LockListener[] = [];

  /**
   * Push a new lock layer onto the top of the stack. This will cause the layer
   * below to be disabled before this lock's callback is enabled.
   * Locks should not enable themselves until the callback has been invoked to
   * ensure that other locks are not also concurrently active.
   */
  add(uid: Lock["uid"], setEnabled: Lock["setEnabled"]) {
    const newLock: Lock = { uid, setEnabled, enabled: false };
    this.toggleLayer(this.current(), false);
    this.locks.push(newLock);
    this.toggleLayer(newLock, true);
    this.emit();
  }

  /**
   * Immediately remove the lock with the given id from the stack. This will
   * call the lock's callback to disable it before removing. Then if it was the
   * currently-active lock, the new current lock will be re-enabled.
   */
  remove(uid: string) {
    const lock = this.locks.find((lock) => lock.uid === uid);
    this.toggleLayer(lock, false);

    const wasCurrent = this.current()?.uid === uid;
    this.locks = this.locks.filter((lock) => lock.uid !== uid);

    if (wasCurrent) this.toggleLayer(this.current(), true);
    this.emit();
  }

  /**
   * Returns the lock that currently lives at the top of the stack.
   */
  current() {
    return this.locks[this.locks.length - 1];
  }

  /**
   * Returns the enabled state of the currently-active lock.
   */
  isActive() {
    return this.current()?.enabled ?? false;
  }

  /**
   * Utility for enabling and disabling layers atomically.
   */
  toggleLayer(lock: Lock | undefined, enabled: boolean) {
    if (lock == null) return;

    lock.setEnabled(enabled);
    lock.enabled = enabled;
  }

  /**
   * Adds a listener that will be invoked whenever the state of the lock stack
   * changes. Callbacks are called with the "enabled" state of the current lock,
   * and the stack itself as a reference.
   *
   * Returns a function to unsubscribe the listener from the stack.
   */
  subscribe(callback: LockListener): () => void {
    this.listeners.push(callback);
    return () => this.listeners.filter((listener) => listener !== callback);
  }

  /**
   * Updates all currently-subscribed listeners with the current state of the
   * lock stack.
   */
  emit() {
    const active = this.isActive();
    this.listeners.forEach((listener) => listener(active, this.locks));
  }
}
