import * as React from "react";

export default function DistributedExample() {
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
