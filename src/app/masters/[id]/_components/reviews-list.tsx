import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

type Review = {
  id: string
  rating: number
  text?: string
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
        <div key={review.id} className="border rounded-lg p-4">
          <div className="flex items-start gap-3 mb-2">
            <Avatar>
              <AvatarImage src={review.profiles.avatar_url} />
              <AvatarFallback>{review.profiles.full_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{review.profiles.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { locale: ru, addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          {review.text && (
            <p className="text-sm text-muted-foreground">{review.text}</p>
          )}
        </div>
      ))}
    </div>
  )
}
