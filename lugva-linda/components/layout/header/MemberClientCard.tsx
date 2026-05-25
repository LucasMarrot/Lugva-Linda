import { CommunityMemberSummary } from '@/lib/words/community';
import { usePresence } from '../../providers/PresenceProvider';
import { toTint } from '@/lib/utils';
import Link from 'next/link';
import { Circle, Swords } from 'lucide-react';
import { Button } from '@/components/ui';

type MemberClientCardProps = {
  member: CommunityMemberSummary;
  activeLanguageId: string;
  setIsOpen: (open: boolean) => void;
  langParam: string;
};

const MemberClientCard = ({
  member,
  setIsOpen,
  activeLanguageId,
}: MemberClientCardProps) => {
  const { onlineUserIds, sendChallenge } = usePresence();
  const isOnline = onlineUserIds.has(member.id);

  const cleanLanguageId = activeLanguageId.replace('?lang=', '');

  const handleChallenge = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    sendChallenge(member.id, cleanLanguageId);
  };

  return (
    <Link
      key={member.id}
      href={`/community/${member.id}${activeLanguageId}`}
      className="group relative block rounded-lg border px-2 py-1.5 transition-colors"
      style={{
        borderColor: `${member.colorHex}66`,
        backgroundColor: toTint(member.colorHex),
      }}
      onClick={() => setIsOpen(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p
            className="truncate text-sm font-semibold sm:text-[0.95rem]"
            style={{ color: member.colorHex }}
          >
            {member.displayName}
          </p>
          <p className="text-muted-foreground truncate text-[11px] sm:text-xs">
            {member.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
            <Circle
              className={
                isOnline
                  ? 'h-2.5 w-2.5 fill-emerald-700 text-emerald-700'
                  : 'text-muted-foreground h-2.5 w-2.5'
              }
            />
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
          {isOnline && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={handleChallenge}
              title="Défier ce joueur en duel !"
            >
              <Swords className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MemberClientCard;
