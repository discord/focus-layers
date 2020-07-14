function createFocusWalker(root: HTMLElement) {
  return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: HTMLElement) =>
      // `.tabIndex` is not the same as the `tabindex` attribute. It works on the
      // runtime's understanding of tabbability, so this automatically accounts
      // for any kind of element that could be tabbed to.
      // @ts-ignore
      node.tabIndex >= 0 && !node.disabled ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
  });
}

/**
 * Given a `root` container element and a `target` that is outside of that
 * container and intended to receive focus, force the DOM focus to wrap around
 * such that it remains within `root`.
 *
 * If `forceFirst` is set to `true`, the wrap will always attempt to focus the
 * first viable element in `root`, rather than wrapping to the end.
 */
export default function wrapFocus(root: HTMLElement, target: Element, forceFirst: boolean = false) {
  const walker = createFocusWalker(root);
  const position = target.compareDocumentPosition(root);
  let wrappedTarget: HTMLElement | null = null;

  if (position & Node.DOCUMENT_POSITION_PRECEDING || forceFirst) {
    wrappedTarget = walker.firstChild() as HTMLElement | null;
  } else if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    wrappedTarget = walker.lastChild() as HTMLElement | null;
  }

  const newFocus = wrappedTarget != null ? wrappedTarget : root;
  newFocus.focus();
}
