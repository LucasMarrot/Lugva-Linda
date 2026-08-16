'use client';

import { useRef, useState, useTransition } from 'react';
import { Bell, LogOut, Settings, UserCog } from 'lucide-react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Switch,
} from '@/components/ui';
import { Link } from 'next-transition-router';
import { useUser } from '@/components/providers/UserProvider';
import { toDisplayName } from '@/lib/words/community';
import { cn } from '@/lib/utils';
import { DarkModeToggle } from './DarkModeToggle';
import { updateNotificationPrefsAction } from '@/actions/push-actions';

type SettingsButtonProps = {
  hideProfileEdit?: boolean;
  initialWordAssignedEnabled?: boolean;
};

const SettingsButton = ({ hideProfileEdit, initialWordAssignedEnabled = true }: SettingsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const signOutRef = useRef<HTMLFormElement | null>(null);

  const { user } = useUser();

  const isContributor = user?.role === 'CONTRIBUTOR';

  const [wordAssignedEnabled, setWordAssignedEnabled] = useState(initialWordAssignedEnabled);
  const [, startSaving] = useTransition();

  function toggleWordAssigned() {
    const newVal = !wordAssignedEnabled;
    setWordAssignedEnabled(newVal);
    startSaving(async () => {
      try {
        await updateNotificationPrefsAction({ wordAssignedEnabled: newVal });
      } catch {
        setWordAssignedEnabled(!newVal);
      }
    });
  }

  if (!user) return null;

  const initialDisplayName = toDisplayName(user.email, user.id, user.username);
  const initialUsername = user.username ?? initialDisplayName;

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
          <Settings
            className={cn(
              'h-5 w-5 transition-colors',
              isOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-2">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3 p-2">
            <div
              className="border-border bg-primary h-10 w-10 shrink-0 rounded-lg border shadow-sm"
              aria-label="Couleur de profil"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold">
                {initialUsername}
              </span>

              <span className="text-muted-foreground truncate text-xs">
                {user?.email}
              </span>
            </div>
            <DarkModeToggle />
          </div>

          {/* Toggle de notification pour les contributeurs */}
          {isContributor && (
            <>
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <Bell className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-sm">Mots à compléter</span>
                </div>
                <Switch
                  checked={wordAssignedEnabled}
                  onCheckedChange={toggleWordAssigned}
                />
              </div>
              <Separator />
            </>
          )}

          <div className="flex flex-col space-y-1">
            {(!hideProfileEdit || isContributor) && (
              <Button
                variant="ghost"
                className="w-full cursor-pointer justify-start"
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href="/settings">
                  <UserCog className="mr-2 h-4 w-4" />
                  Modifier mes informations
                </Link>
              </Button>
            )}

            <form
              ref={signOutRef}
              action="/auth/signout"
              method="post"
              className="w-full"
            >
              <Button
                type="submit"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full cursor-pointer justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
            </form>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsButton;
