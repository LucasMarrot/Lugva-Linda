import { Badge } from '@/components/ui/badge';

export const MANDATORY_TAGS = [
  'Nom',
  'Verbe',
  'Adjectif',
  'Adverbe',
  'Pronom',
  'Déterminant',
  'Préposition',
  'Conjonction',
  'Interjection',
  'Expression',
  'Phrase',
] as const;

type TagSelectorProps = {
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
};

export const TagSelector = ({ selectedTag, onSelectTag }: TagSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {MANDATORY_TAGS.map((tag) => {
        const isSelected = selectedTag === tag;

        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onSelectTag(tag)}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
};
