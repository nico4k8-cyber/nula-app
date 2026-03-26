/**
 * ResourceButtons — Interactive resource selection for TRIZ phase 3-4
 * Displays available resources as clickable chips
 */

export default function ResourceButtons({
  resources,
  currentResource,
  onSelectResource,
  disabled = false
}) {
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="text-xs font-semibold text-gray-600 mb-2">
        💡 Выбери ресурс:
      </div>
      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => {
          const isActive = resource.id === currentResource;
          return (
            <button
              key={resource.id}
              onClick={() => {
                if (!disabled) onSelectResource(resource.id);
              }}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                isActive
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {resource.id}
            </button>
          );
        })}
      </div>
      {currentResource && (
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-semibold">Текущий:</span> {currentResource}
        </div>
      )}
    </div>
  );
}
