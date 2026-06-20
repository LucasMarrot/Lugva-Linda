'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUnavailableColorsAction,
  updateUserColor,
} from '@/actions/user-actions';
import { userColorSchema } from '@/lib/validation/schemas';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { StateMessage, ColorSelection } from '@/components/shared';
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
  const [unavailableColors, setUnavailableColors] = useState<string[]>([]);

  useEffect(() => {
    getUnavailableColorsAction()
      .then(setUnavailableColors)
      .catch(console.error);
  }, []);

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
        <ColorSelection
          value={selectedColor}
          initialColor={initialColorHex}
          onChange={(newColor) => {
            setSelectedColor(newColor);
            if (colorStatus) setColorStatus(null);
          }}
          unavailableColors={unavailableColors}
        />

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
