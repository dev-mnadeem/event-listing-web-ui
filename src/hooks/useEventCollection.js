import { useCallback, useEffect, useState } from "react";
import config from "../config";
import { useEvent } from "../context/EventContext";

const FIRST_PAGE = 1;

/**
 * Fetch one paginated list of events.
 *
 * The three home-page sections differ only in which endpoint they call and what
 * they say when empty, so the fetching, paging, loading and error handling live
 * here once instead of three times.
 *
 * @param {(pagination: {page: number, perPage: number}) => Promise<{items: object[], total: number, page: number, perPage: number}>} fetchPage
 * @param {{enabled?: boolean}} [options]
 */
const useEventCollection = (fetchPage, { enabled = true } = {}) => {
  const { revision } = useEvent();
  const [page, setPage] = useState(FIRST_PAGE);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const perPage = config.pageSize;

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setTotal(0);
      setLoading(false);
      return undefined;
    }

    // A page change or a revision bump can land while an earlier request is
    // still in flight. Without this flag the slower response wins and the list
    // shows the page the user just left.
    let current = true;
    setLoading(true);
    setError(null);

    fetchPage({ page, perPage })
      .then((result) => {
        if (!current) return;
        setEvents(result.items);
        setTotal(result.total);
      })
      .catch((caught) => {
        if (!current) return;
        setEvents([]);
        setTotal(0);
        // A rejected token is already handled centrally by signing the user
        // out, so reporting it here as well would double the message.
        setError(caught.isAuthFailure ? null : caught);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [fetchPage, page, perPage, revision, enabled]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  // Deleting the last event on the last page would otherwise strand the user on
  // an empty page that the API answers with `200 []`.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const goToPage = useCallback(
    (next) => setPage((current) => (next >= FIRST_PAGE ? next : current)),
    [],
  );

  return { events, total, page, pageCount, perPage, loading, error, goToPage };
};

export default useEventCollection;
