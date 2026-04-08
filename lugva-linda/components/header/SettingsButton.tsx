import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui';

const SettingsButton = () => {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/settings">
        <Settings className="text-muted-foreground hover:text-foreground h-5 w-5 transition-colors" />
      </Link>
    </Button>
  );
};

export default SettingsButton;
