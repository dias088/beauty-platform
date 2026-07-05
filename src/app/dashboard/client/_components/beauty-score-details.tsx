'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react'

type ScoreData = {
  score: number
  level: string
  total_bookings: number
  completed_bookings: number
  no_shows: number
  late_cancellations: number
}

const LEVEL_INFO = {
  new: {
    emoji: '🆕',
    name: 'Новый',
    bg: 'bg-blue-50 border-blue-100',
    text: 'text-blue-900',
    muted: 'text-blue-700',
    bar: 'bg-blue-400',
    track: 'bg-blue-200',
    minScore: 0,
    maxScore: 49,
    benefits: ['Доступны все услуги', 'Может потребоваться предоплата'],
    nextLevel: { score: 50, name: 'Проверенный' },
  },
  verified: {
    emoji: '✅',
    name: 'Проверенный',
    bg: 'bg-amber-50 border-amber-100',
    text: 'text-amber-900',
    muted: 'text-amber-700',
    bar: 'bg-amber-400',
    track: 'bg-amber-200',
    minScore: 50,
    maxScore: 149,
    benefits: ['Доступны все услуги', 'Предоплата по выбору мастера', '5% скидка'],
    nextLevel: { score: 150, name: 'Доверенный' },
  },
  trusted: {
    emoji: '⭐',
    name: 'Доверенный',
    bg: 'bg-green-50 border-green-100',
    text: 'text-green-900',
    muted: 'text-green-700',
    bar: 'bg-green-400',
    track: 'bg-green-200',
    minScore: 150,
    maxScore: 999,
    benefits: ['Доступны все услуги', 'Предоплата не требуется', '10% скидка на услуги'],
    nextLevel: null,
  },
}

export function BeautyScoreDetails({ score }: { score: ScoreData }) {
  const cfg = LEVEL_INFO[score.level as keyof typeof LEVEL_INFO] ?? LEVEL_INFO.new
  const progress = cfg.nextLevel
    ? Math.min(Math.round((score.score / cfg.nextLevel.score) * 100), 100)
    : 100
  const pointsToNext = cfg.nextLevel ? cfg.nextLevel.score - score.score : null

  return (
    <div className="space-y-4">
      {/* Основная карточка */}
      <Card className={`p-6 ${cfg.bg} border`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${cfg.muted} mb-1`}>Ваш статус</p>
            <h2 className={`text-3xl font-bold ${cfg.text}`}>{cfg.emoji} {cfg.name}</h2>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold ${cfg.text}`}>{score.score}</p>
            <p className={`text-xs ${cfg.muted}`}>баллов</p>
          </div>
        </div>

        {cfg.nextLevel && (
          <div>
            <div className="flex justify-between mb-1.5">
              <p className={`text-sm ${cfg.muted}`}>До уровня «{cfg.nextLevel.name}»</p>
              <p className={`text-sm font-semibold ${cfg.text}`}>{pointsToNext} баллов</p>
            </div>
            <div className={`w-full ${cfg.track} rounded-full h-2.5`}>
              <div
                className={`${cfg.bar} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!cfg.nextLevel && (
          <p className={`text-sm font-medium ${cfg.muted}`}>🎉 Вы достигли максимального уровня!</p>
        )}
      </Card>

      {/* Как начисляются баллы */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Как начисляются баллы
        </h3>
        <div className="space-y-3">
          {[
            { points: '+10', color: 'bg-green-500', title: 'Выполненная услуга', desc: 'Запись отмечена мастером как завершённая' },
            { points: '-25', color: 'bg-red-500', title: 'No-show (не пришли)', desc: 'Запись была проигнорирована без отмены' },
            { points: '-10', color: 'bg-orange-500', title: 'Поздняя отмена', desc: 'Отмена менее чем за 24 часа до записи' },
          ].map(item => (
            <div key={item.points} className="flex items-start gap-3">
              <Badge className={`mt-0.5 shrink-0 ${item.color} text-white border-0`}>{item.points}</Badge>
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Преимущества */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Привилегии уровня «{cfg.name}»</h3>
        <div className="space-y-2.5">
          {cfg.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-sm">{benefit}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Предупреждение */}
      {(score.no_shows > 0 || score.late_cancellations > 0) && (
        <Card className="p-5 border-orange-200 bg-orange-50">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900 text-sm">Обратите внимание</p>
              <p className="text-sm text-orange-800 mt-1">
                {score.no_shows > 0 && `No-show: ${score.no_shows} раз. `}
                {score.late_cancellations > 0 && `Поздних отмен: ${score.late_cancellations}. `}
                Это снижает ваш Beauty Score. Старайтесь отменять заблаговременно!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Статистика */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Статистика</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: score.total_bookings,      label: 'Всего записей',   color: '' },
            { value: score.completed_bookings,  label: 'Завершено',       color: 'text-green-600' },
            { value: score.no_shows,            label: 'No-shows',        color: 'text-red-600' },
            { value: score.late_cancellations,  label: 'Поздних отмен',   color: 'text-orange-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-muted/40 rounded-lg p-3">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
