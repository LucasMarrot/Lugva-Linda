import { cn } from '@/lib/utils';

export interface PictoLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function PictoLogo({ className, ...props }: PictoLogoProps) {
  return (
    <svg
      viewBox="0 0 201.07 155.52"
      fill="currentColor"
      aria-label="Lugva Linda Picto"
      role="img"
      className={cn('h-6 w-auto shrink-0', className)}
      {...props}
    >
      <path d="m108.9,89.8l-9.66,45.17H14.02c-10.09,0-16.87-10.36-12.83-19.61L47.88,8.4c2.23-5.1,7.27-8.4,12.83-8.4h46.18l-49.27,89.8h51.27Z" />
      <path d="m92.16,65.72l9.66-45.17h85.22c10.09,0,16.87,10.36,12.83,19.61l-46.7,106.96c-2.23,5.1-7.27,8.4-12.83,8.4h-46.18l49.27-89.8h-51.27Z" />
    </svg>
  );
}
