import React from "react";

/**
 * Previous/next paging driven by `X-Total-Count`, not by whether the last
 * response happened to be full.
 */
const Pagination = ({ page, pageCount, onChange, label }) => {
  if (pageCount <= 1) return null;

  return (
    <nav className="pager" aria-label={label}>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span className="pager__status">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
