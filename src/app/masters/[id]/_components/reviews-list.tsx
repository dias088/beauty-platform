import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

type Review = {
  id: string
  rating: number
  text?: string
  photos?: string[]
  created_at: string
  profiles: {
    full_name: string
    avatar_url?: string
  }
}

type Props = {
  reviews: Review[]
}

export function ReviewsList({ reviews }: Props) {
  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="surface rounded-[14px] p-4">
          <div className="mb-2 flex items-start gap-3">
            <Avatar>
              <AvatarImage src={review.profiles.avatar_url} />
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {review.profiles.full_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-white">{review.profiles.full_name}</p>
              <p className="text-xs text-[var(--text-3)]">
                {formatDistanceToNow(new Date(review.created_at), { locale: ru, addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="mb-2 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating
                    ? 'fill-[#fbbf24] text-[#fbbf24]'
                    : 'text-white/15'
                }`}
              />
            ))}
          </div>

          {review.text && (
            <p className="text-sm text-[var(--text-2)]">{review.text}</p>
          )}

          {review.photos && review.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.photos.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10"
                >
                  <Image src={url} alt={`Фото к отзыву ${i + 1}`} fill className="object-cover transition-transform hover:scale-105" sizes="80px" />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
