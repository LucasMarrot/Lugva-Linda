'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listCommunityMembersAction } from '@/actions/word-actions';
import { usePresence } from '@/components/providers/PresenceProvider';
import { useMaybeActiveLanguage } from '@/components/providers/ActiveLanguageProvider';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { Spinner } from '@/components/ui/spinner';
import { type CommunityMemberSummary } from '@/lib/words/community';
import MemberClientCard from './MemberClientCard';

export const MembersPopoverButton = () => {
  const { currentUserId } = usePresence();
  const languageContext = useMaybeActiveLanguage();

  const [members, setMembers] = useState<CommunityMemberSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await listCommunityMembersAction();
        setMembers(data);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOpen]);

  const visibleMembers = useMemo(
    () => members.filter((member) => member.id !== currentUserId),
    [currentUserId, members],
  );

  const langParam = languageContext?.activeLanguageId
    ? `?lang=${languageContext.activeLanguageId}`
    : '';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'cursor-pointer',
            isOpen && 'bg-primary/10 text-primary hover:bg-primary/15',
          )}
        >
          <Users
            className={cn(
              'h-5 w-5 transition-colors',
              isOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="max-h-[60dvh] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto p-2"
      >
        <div className="space-y-1.5">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : visibleMembers.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-xs">
              Aucun autre membre.
            </p>
          ) : (
            visibleMembers.map((member) => (
              <MemberClientCard
                key={member.id}
                member={member}
                setIsOpen={setIsOpen}
                activeLanguageId={langParam}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
