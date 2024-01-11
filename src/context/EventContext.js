import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const EventContext = createContext(null);

/**
 * A single revision counter that every event list watches.
 *
 * Creating, editing, deleting or booking an event changes what belongs in more
 * than one of the three lists — booking moves a row from "upcoming" to
 * "booked", deleting removes it from both. Splicing each list by hand is how
 * they drift apart, so a mutation bumps the revision and the lists re-fetch
 * from whichever backend is in use.
 */
export const EventProvider = ({ children }) => {
  const [revision, setRevision] = useState(0);

  const refreshEvents = useCallback(() => setRevision((current) => current + 1), []);

  const value = useMemo(() => ({ revision, refreshEvents }), [revision, refreshEvents]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};

export default EventContext;
