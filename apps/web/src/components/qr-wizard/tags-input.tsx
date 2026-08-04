'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { QR_MAX_TAGS, QR_TAG_MAX_LENGTH } from '@qrgen/shared';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = React.useState('');

  const addTag = () => {
    const tag = draft.trim();
    if (!tag || value.includes(tag) || value.length >= QR_MAX_TAGS) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded-full p-0.5 hover:bg-background/50"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {value.length < QR_MAX_TAGS && (
        <Input
          value={draft}
          maxLength={QR_TAG_MAX_LENGTH}
          placeholder="Add a tag and press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
        />
      )}
    </div>
  );
}
