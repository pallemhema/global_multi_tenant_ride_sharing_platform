const EmptyState = ({
  title = "All caught up!",
  description = "There are no pending requests at the moment.",
  icon = "🎉",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>

      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        {title}
      </h3>

      <p className="text-sm text-gray-500 max-w-sm">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
