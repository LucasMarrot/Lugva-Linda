'use client';

import { useState } from 'react';
import { Input, Button, Badge } from '@/components/ui';
import { Plus } from 'lucide-react';

type CustomTagSelectorProps = {
  availableCustomTags: string[];
  selectedCustomTags: string[];
  onAddCustomTag: (tag: string) => void;
  onRemoveCustomTag: (tag: string) => void;
};

export const CustomTagSelector = ({
  availableCustomTags,
  selectedCustomTags,
  onAddCustomTag,
  onRemoveCustomTag,
}: CustomTagSelectorProps) => {
  const [value, setValue] = useState('');

  const normalizeTag = (tag: string) => tag.trim().toLocaleLowerCase();

  const findSelectedMatch = (tag: string) =>
    selectedCustomTags.find(
      (selectedTag) => normalizeTag(selectedTag) === normalizeTag(tag),
    );

  const findAvailableMatch = (tag: string) =>
    availableCustomTags.find(
      (availableTag) => normalizeTag(availableTag) === normalizeTag(tag),
    );

  const addTag = () => {
    const next = value.trim();
    if (!next) return;

    if (findSelectedMatch(next)) {
      setValue('');
      return;
    }

    const existingAvailableTag = findAvailableMatch(next);
    onAddCustomTag(existingAvailableTag ?? next);
    setValue('');
  };

  return (
    <div className="space-y-3">
      {availableCustomTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableCustomTags.map((tag) => {
            const selectedMatch = findSelectedMatch(tag);
            const isSelected = Boolean(selectedMatch);

            return (
              <Badge
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => {
                  if (selectedMatch) {
                    onRemoveCustomTag(selectedMatch);
                    return;
                  }

                  onAddCustomTag(tag);
                }}
              >
                {tag}
              </Badge>
            );
          })}

          {selectedCustomTags.length > 0 && (
            <>
              {selectedCustomTags.map((tag) => {
                const hasAvailableMatch = Boolean(findAvailableMatch(tag));

                return (
                  !hasAvailableMatch && (
                    <Badge
                      key={tag}
                      variant="default"
                      onDelete={() => onRemoveCustomTag(tag)}
                      deleteLabel={'Retirer ' + tag}
                    >
                      {tag}
                    </Badge>
                  )
                );
              })}
            </>
          )}
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
          <Plus className="h-4 w-4" />
          <span className="sr-only">Ajouter</span>
        </Button>
      </div>
    </div>
  );
};
