import { Separator } from '../ui';
import { Badge } from '../ui/badge';

type TagFilterProps = {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
};

export const TagFilter = ({
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: TagFilterProps) => {
  if (allTags.length === 0) return null;

  return (
    <div className="no-scrollbar mb-6 flex h-fit flex-wrap items-center gap-2 overflow-x-auto px-4 pb-2">
      <Badge
        variant={selectedTags.length === 0 ? 'default' : 'outline'}
        onClick={onClearTags}
        className={
          selectedTags.length === 0 ? undefined : 'opacity-60 hover:opacity-100'
        }
      >
        Tous
      </Badge>

      <div className="h-4">
        <Separator orientation="vertical" />
      </div>

      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onToggleTag(tag)}
            className={isSelected ? undefined : 'opacity-60 hover:opacity-100'}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
};
