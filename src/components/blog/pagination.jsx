export default function BlogPagination({ pagination, basePath = "/blog" }) {
  const {
    currentPage,
    lastPage,
    url: { next, prev },
  } = pagination;

  if (lastPage === 1) {
    return <></>;
  }

  const pageLinks = [];
  for (let i = 1; i <= lastPage; i++) {
    pageLinks.push(
      <li key={i}>
        <a
          className={`inline-block px-4 py-2 rounded-lg font-semibold ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:text-blue-600"
          }`}
          href={i === 1 ? basePath : `${basePath}/${i}`}
        >
          {i}
        </a>
      </li>,
    );
  }

  return (
    <nav className="flex justify-center mt-12">
      <ul className="flex items-center gap-2">
        {prev && (
          <li>
            <a
              className="inline-block px-4 py-2 text-gray-700 hover:text-blue-600"
              href={prev}
              aria-label="Previous page"
            >
              &larr;
            </a>
          </li>
        )}
        {pageLinks}
        {next && (
          <li>
            <a
              className="inline-block px-4 py-2 text-gray-700 hover:text-blue-600"
              href={next}
              aria-label="Next page"
            >
              &rarr;
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
