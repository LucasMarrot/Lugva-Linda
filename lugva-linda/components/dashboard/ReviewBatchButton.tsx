import { Button } from '@/components/ui/button'

type ReviewBatchButtonProps = {
  count: number
}

export const ReviewBatchButton = ({ count }: ReviewBatchButtonProps) => {
  return (
    <Button className="flex h-14 flex-col gap-1 shadow-sm">
      <span className="text-[10px] uppercase opacity-90">Révisez</span>
      <span className="text-lg font-bold">{count}</span>
      <span className="text-[10px] uppercase opacity-90">Mots</span>
    </Button>
  )
}
