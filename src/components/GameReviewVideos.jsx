/**
 * Extracts YouTube video ID from watch or youtu.be URL.
 * @param {string} url
 * @returns {string|null}
 */
function getYoutubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m1 = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (m1) return m1[1];
  const m2 = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (m2) return m2[1];
  return null;
}

/**
 * Bento-style grid of embedded YouTube videos (1–3). Renders nothing if no valid links.
 */
export default function GameReviewVideos({ links = [] }) {
  const validIds = (Array.isArray(links) ? links : [])
    .map(getYoutubeVideoId)
    .filter(Boolean);

  if (validIds.length === 0) return null;

  const count = validIds.length;
  const gridClass =
    count === 1
      ? 'grid-cols-1 max-w-md'
      : count === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews & videos</h2>
      <div className={`grid ${gridClass} gap-4`}>
        {validIds.map((videoId) => (
          <div
            key={videoId}
            className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-video"
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </div>
  );
}
