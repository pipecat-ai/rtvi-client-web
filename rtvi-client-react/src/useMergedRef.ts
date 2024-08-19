/**
 * Original source: https://github.com/jaredLunde/react-hook/blob/master/packages/merged-ref/src/index.tsx
 * Original author: Jared Lunde (https://github.com/jaredLunde)
 * Originally published under the MIT license: https://github.com/jaredLunde/react-hook/blob/master/LICENSE
 */

import React, { useCallback } from "react";

function useMergedRef<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return useCallback(
    (element: T) => {
      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if (typeof ref === "function") ref(element);
        else if (ref && typeof ref === "object")
          (ref as React.MutableRefObject<T>).current = element;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}

export default useMergedRef;
