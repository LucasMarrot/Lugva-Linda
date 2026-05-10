'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, FastForward, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui';

const triggerConfetti = (buttonElement: HTMLElement, userColorHex?: string) => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const rect = buttonElement.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;

  let r = 59,
    g = 130,
    b = 246;

  if (userColorHex) {
    const sanitized = userColorHex.replace('#', '');
    if (sanitized.length === 6) {
      r = parseInt(sanitized.substring(0, 2), 16);
      g = parseInt(sanitized.substring(2, 4), 16);
      b = parseInt(sanitized.substring(4, 6), 16);
    }
  } else {
    const tempDiv = document.createElement('div');
    tempDiv.className = 'text-primary';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    const computedColor = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);

    const match = computedColor.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0], 10);
      g = parseInt(match[1], 10);
      b = parseInt(match[2], 10);
    }
  }

  const tint = (factor: number) =>
    `rgb(${Math.min(255, r + (255 - r) * factor)}, ${Math.min(255, g + (255 - g) * factor)}, ${Math.min(255, b + (255 - b) * factor)})`;
  const shade = (factor: number) =>
    `rgb(${Math.max(0, r * (1 - factor))}, ${Math.max(0, g * (1 - factor))}, ${Math.max(0, b * (1 - factor))})`;

  const colors = [
    { front: `rgb(${r}, ${g}, ${b})`, back: shade(0.2) },
    { front: tint(0.3), back: `rgb(${r}, ${g}, ${b})` },
    { front: shade(0.1), back: shade(0.3) },
  ];

  const confettiCount = 20;
  const sequinCount = 10;
  const gravityConfetti = 0.3;
  const gravitySequins = 0.55;
  const dragConfetti = 0.075;
  const dragSequins = 0.02;
  const terminalVelocity = 3;

  const randomRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const initConfettoVelocity = (
    xRange: [number, number],
    yRange: [number, number],
  ) => {
    const x = randomRange(xRange[0], xRange[1]);
    const range = yRange[1] - yRange[0] + 1;
    let y =
      yRange[1] -
      Math.abs(randomRange(0, range) + randomRange(0, range) - range);
    if (y >= yRange[1] - 1) {
      y += Math.random() < 0.25 ? randomRange(1, 3) : 0;
    }
    return { x, y: -y };
  };

  const createConfetto = () => ({
    randomModifier: randomRange(0, 99),
    color: colors[Math.floor(randomRange(0, colors.length))],
    dimensions: { x: randomRange(5, 9), y: randomRange(8, 15) },
    position: {
      x: randomRange(originX - rect.width / 4, originX + rect.width / 4),
      y: randomRange(rect.bottom + 8, rect.bottom + rect.height - 8),
    },
    rotation: randomRange(0, 2 * Math.PI),
    scale: { x: 1, y: 1 },
    velocity: initConfettoVelocity([-9, 9], [6, 11]),
    update() {
      this.velocity.x -= this.velocity.x * dragConfetti;
      this.velocity.y = Math.min(
        this.velocity.y + gravityConfetti,
        terminalVelocity,
      );
      this.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.scale.y = Math.cos((this.position.y + this.randomModifier) * 0.09);
    },
  });

  const createSequin = () => ({
    color: colors[Math.floor(randomRange(0, colors.length))].back,
    radius: randomRange(1, 2),
    position: {
      x: randomRange(originX - rect.width / 3, originX + rect.width / 3),
      y: randomRange(rect.bottom + 8, rect.bottom + rect.height - 8),
    },
    velocity: { x: randomRange(-6, 6), y: randomRange(-8, -12) },
    update() {
      this.velocity.x -= this.velocity.x * dragSequins;
      this.velocity.y = this.velocity.y + gravitySequins;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
    },
  });

  let activeConfetti = Array.from({ length: confettiCount }, createConfetto);
  let activeSequins = Array.from({ length: sequinCount }, createSequin);

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    activeConfetti.forEach((c) => {
      const width = c.dimensions.x * c.scale.x;
      const height = c.dimensions.y * c.scale.y;
      ctx.translate(c.position.x, c.position.y);
      ctx.rotate(c.rotation);
      c.update();
      ctx.fillStyle = c.scale.y > 0 ? c.color.front : c.color.back;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (c.velocity.y < 0)
        ctx.clearRect(rect.left, rect.top, rect.width, rect.height);
    });

    activeSequins.forEach((s) => {
      ctx.translate(s.position.x, s.position.y);
      s.update();
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (s.velocity.y < 0)
        ctx.clearRect(rect.left, rect.top, rect.width, rect.height);
    });

    activeConfetti = activeConfetti.filter((c) => c.position.y < canvas.height);
    activeSequins = activeSequins.filter((s) => s.position.y < canvas.height);

    if (activeConfetti.length === 0 && activeSequins.length === 0) {
      if (document.body.contains(canvas)) document.body.removeChild(canvas);
      return;
    }
    requestAnimationFrame(render);
  };

  render();
};

type DueTodayReviewButtonProps = {
  languageId: string;
  todayWordCount: number;
  nextSessionDate: Date | null;
  nextSessionWordCount?: number;
  colorHex?: string;
};

export const DueTodayReviewButton = ({
  languageId,
  todayWordCount,
  nextSessionDate,
  nextSessionWordCount = 0,
  colorHex,
}: DueTodayReviewButtonProps) => {
  const router = useRouter();

  const formattedDate = nextSessionDate
    ? format(nextSessionDate, 'd MMMM', { locale: fr })
    : '';

  const handleTodayReviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    triggerConfetti(e.currentTarget, colorHex);

    setTimeout(() => {
      router.push(`/review?lang=${languageId}`);
    }, 600);
  };

  if (todayWordCount > 0) {
    return (
      <Button
        className="shadow-primary/50 flex flex-col gap-0 p-6 font-semibold shadow-sm transition-transform active:scale-95"
        size="lg"
        onClick={handleTodayReviewClick}
      >
        <span className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5" /> Réviser la séance du jour
        </span>
        <span className="text-xs font-normal opacity-80">
          {formattedDate} — {todayWordCount} mots
        </span>
      </Button>
    );
  }

  if (nextSessionDate) {
    return (
      <Button
        asChild
        variant="outlinePrimary"
        className="shadow-primary/50 flex flex-col gap-0 p-6 font-semibold shadow-sm"
        size="lg"
      >
        <Link href={`/review?lang=${languageId}&mode=ALLOW_EARLY`}>
          <span className="flex items-center gap-2 text-base">
            <FastForward className="h-5 w-5" /> S&apos;avancer sur les révisions
          </span>
          <span className="text-xs font-normal opacity-80">
            {formattedDate} — {nextSessionWordCount} mots
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <Button size="lg" disabled>
      <CheckCircle className="mr-2 h-5 w-5" />
      Aucune révision prévue
    </Button>
  );
};
