import { Star } from 'lucide-react';

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'fill-[#F7B926] text-[#F7B926]' : 'fill-[#E4E4E4] text-[#E4E4E4]'}
        />
      ))}
    </span>
  );
}
