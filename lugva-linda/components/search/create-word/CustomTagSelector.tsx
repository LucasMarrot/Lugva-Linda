'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

type CustomTagSelectorProps = {
  selectedCustomTags: string[];
  onAddCustomTag: (tag: string) => void;
  onRemoveCustomTag: (tag: string) => void;
};

export const CustomTagSelector = ({
  selectedCustomTags,
  onAddCustomTag,
  onRemoveCustomTag,
}: CustomTagSelectorProps) => {
  const [value, setValue] = useState('');

  const addTag = () => {
    const next = value.trim();
    if (!next) return;
    if (selectedCustomTags.includes(next)) {
      setValue('');
      return;
    }

    onAddCustomTag(next);
    setValue('');
  };

  return (
    <div className="space-y-3">
      {selectedCustomTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCustomTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              onDelete={() => onRemoveCustomTag(tag)}
              deleteLabel={'Retirer ' + tag}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="Ajouter un tag personnalisé"
          className="h-11 pr-12"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={addTag}
          disabled={!value.trim()}
          className="absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />{' '}
          <span className="sr-only">Ajouter</span>{' '}
        </Button>
      </div>
    </div>
  );
};
