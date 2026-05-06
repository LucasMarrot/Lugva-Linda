'use client';

import { toDisplayName } from '@/lib/words/community';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ColorSection } from './settings-client/ColorSection';
import { PasswordSection } from './settings-client/PasswordSection';
import { ProfileSection } from './settings-client/ProfileSection';
import { DangerZoneSection } from './settings-client/DangerZoneSection';

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  colorHex: string;
};

type SettingsClientProps = {
  profile: UserProfile;
};

export const SettingsClient = ({ profile }: SettingsClientProps) => {
  const initialDisplayName = toDisplayName(
    profile.email,
    profile.id,
    profile.username,
  );
  const initialUsername = profile.username ?? initialDisplayName;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Mettez a jour votre identite et vos informations de connexion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-border bg-muted/20 space-y-1 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Aperçu
            </p>
            <p className="text-lg font-semibold">{initialDisplayName}</p>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>

          <ProfileSection
            initialUsername={initialUsername}
            initialEmail={profile.email}
          />
        </CardContent>
      </Card>

      <ColorSection initialColorHex={profile.colorHex} />

      <PasswordSection />

      <DangerZoneSection />
    </div>
  );
};
