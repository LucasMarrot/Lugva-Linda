import { CommunityMemberSummary } from '@/lib/words/community';
import { usePresence } from '../../providers/PresenceProvider';
import { toTint } from '@/lib/utils';
import Link from 'next/link';
import { Circle } from 'lucide-react';

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
  const { onlineUserIds } = usePresence();
  const isOnline = onlineUserIds.has(member.id);

  return (
    <Link
      key={member.id}
      href={`/community/${member.id}${activeLanguageId}`}
      className="block rounded-lg border px-2 py-1.5 transition-colors hover:brightness-95"
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
      </div>
    </Link>
  );
};

export default MemberClientCard;
