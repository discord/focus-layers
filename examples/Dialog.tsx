import * as React from "react";
import useFocusLock from "../src/useFocusLock";

type DialogProps = {
  children: React.ReactNode;
};

// Simple Dialog component that implements a focus lock with appropriate ARIA defaults.
function Dialog({ children }: DialogProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  useFocusLock(containerRef);

  return (
    <div
      role="dialog"
      ref={containerRef}
      tabIndex={-1}
      aria-modal="true"
      style={{
        border: "1px solid #777",
        borderRadius: 4,
        padding: 8,
        margin: "8px 0",
      }}>
      {children}
    </div>
  );
}

export default Dialog;
