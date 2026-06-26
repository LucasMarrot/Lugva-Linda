import { AlertCircle } from 'lucide-react';

export const ContributorConfigError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <AlertCircle className="text-destructive mb-4 h-12 w-12" />
      <h1 className="text-destructive mb-2 text-xl font-bold">
        Configuration incomplète
      </h1>
      <p className="text-muted-foreground max-w-md">
        Votre compte contributeur n&apos;est pas encore lié à un dictionnaire.
        Veuillez demander à l&apos;administrateur de vous assigner un
        utilisateur et une langue cible.
      </p>
    </div>
  );
};
