'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserColor } from '@/actions/user-actions';
import { userColorSchema } from '@/lib/validation/schemas';
import { USER_COLOR_OPTIONS } from '@/lib/users/colors';
import { cn } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { StateMessage } from '@/components/shared';
import { parseActionError, StatusState } from './parseActionError';

type ColorSectionProps = {
  initialColorHex: string;
};

export const ColorSection = ({ initialColorHex }: ColorSectionProps) => {
  const router = useRouter();

  const [selectedColor, setSelectedColor] = useState(initialColorHex);
  const [colorBaseline, setColorBaseline] = useState(initialColorHex);
  const [colorStatus, setColorStatus] = useState<StatusState>(null);
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);

  const colorValidation = useMemo(
    () => userColorSchema.safeParse(selectedColor),
    [selectedColor],
  );
  const colorError = colorValidation.success
    ? null
    : (colorValidation.error.issues[0]?.message ?? 'Couleur invalide.');
  const isColorDirty = selectedColor !== colorBaseline;

  const handleUpdateColor = async (formData: FormData) => {
    if (!colorValidation.success || !isColorDirty) return;
    try {
      setIsUpdatingColor(true);
      setColorStatus(null);
      await updateUserColor(formData);
      setColorBaseline(selectedColor);
      setColorStatus({ tone: 'success', message: 'Couleur mise a jour.' });
      router.refresh();
    } catch (error) {
      setColorStatus({
        tone: 'error',
        message: parseActionError(
          error,
          'Impossible de mettre a jour la couleur.',
        ),
      });
    } finally {
      setIsUpdatingColor(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Couleur</CardTitle>
        <CardDescription>
          Choisissez une couleur lisible sur fond clair ou fonce.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="border-border h-12 w-12 rounded-lg border"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <p className="text-sm font-semibold">
              {selectedColor === initialColorHex
                ? 'Couleur actuelle'
                : 'Nouvelle couleur'}
            </p>
            <p className="text-muted-foreground text-xs">{selectedColor}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {USER_COLOR_OPTIONS.map((color) => {
            const isActive = color === selectedColor;
            return (
              <button
                key={color}
                type="button"
                aria-pressed={isActive}
                aria-label={`Choisir ${color}`}
                className={cn(
                  'h-10 w-10 rounded-full border transition-shadow',
                  isActive
                    ? 'border-foreground ring-foreground/40 ring-2'
                    : 'border-border cursor-pointer',
                  color === initialColorHex && 'ring-foreground/40 ring-2',
                )}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color);
                  if (colorStatus) setColorStatus(null);
                }}
              />
            );
          })}
        </div>

        {colorError && (
          <p className="text-destructive text-sm font-medium">{colorError}</p>
        )}

        {colorStatus && (
          <StateMessage tone={colorStatus.tone} message={colorStatus.message} />
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <form action={handleUpdateColor} className="w-full">
          <input type="hidden" name="colorHex" value={selectedColor} />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                !colorValidation.success || !isColorDirty || isUpdatingColor
              }
            >
              {isUpdatingColor ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
};
