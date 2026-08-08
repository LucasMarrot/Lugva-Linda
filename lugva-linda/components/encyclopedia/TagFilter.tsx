import { Separator } from '../ui';
import { Badge } from '../ui/badge';

type TagFilterProps = {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  statusFilter?: 'all' | 'to_complete';
  onStatusFilterChange?: (status: 'all' | 'to_complete') => void;
  toCompleteCount?: number;
};

export const TagFilter = ({
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  statusFilter,
  onStatusFilterChange,
  toCompleteCount = 0,
}: TagFilterProps) => {
  const showStatusFilter =
    statusFilter !== undefined &&
    onStatusFilterChange !== undefined &&
    toCompleteCount > 0;

  if (allTags.length === 0 && !showStatusFilter) return null;

  return (
    <div className="no-scrollbar mb-6 flex h-fit flex-wrap items-center gap-2 overflow-x-auto px-4 pb-2">
      <Badge
        variant={
          selectedTags.length === 0 && statusFilter !== 'to_complete'
            ? 'default'
            : 'outline'
        }
        onClick={() => {
          onClearTags();
          onStatusFilterChange?.('all');
        }}
        className={
          selectedTags.length === 0 && statusFilter !== 'to_complete'
            ? undefined
            : 'opacity-60 hover:opacity-100'
        }
      >
        Tous
      </Badge>

      {(allTags.length > 0 || showStatusFilter) && (
        <div className="h-4">
          <Separator orientation="vertical" />
        </div>
      )}

      {showStatusFilter && (
        <Badge
          variant={statusFilter === 'to_complete' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('to_complete')}
          className={
            statusFilter === 'to_complete'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'border-amber-500/50 text-amber-600 opacity-60 hover:opacity-100'
          }
        >
          À compléter
        </Badge>
      )}



      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => {
              onStatusFilterChange?.('all');
              onToggleTag(tag);
            }}
            className={isSelected ? undefined : 'opacity-60 hover:opacity-100'}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
};
