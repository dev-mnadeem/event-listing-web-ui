import { useCallback, useEffect, useRef } from "react";

/**
 * Guard for state updates that land after the component has gone.
 *
 * A confirm dialog is unmounted by its parent the moment the action it
 * confirmed succeeds, so the `finally` that re-enables its button would
 * otherwise set state on a component that no longer exists.
 */
const useIsMounted = () => {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback(() => mounted.current, []);
};

export default useIsMounted;
