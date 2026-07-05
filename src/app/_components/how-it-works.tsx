import { Search, Calendar, Star, UserPlus, Clock, TrendingUp } from 'lucide-react'

const CLIENT_STEPS = [
  { icon: Search,    title: 'Найди мастера',       desc: 'Фильтруй по категории, цене и рейтингу. Смотри портфолио и отзывы.' },
  { icon: Calendar,  title: 'Выбери время',         desc: 'Выбери удобный слот из расписания мастера. Без звонков и переписок.' },
  { icon: Star,      title: 'Получи скидку',        desc: 'Накапливай Beauty Score — получай до 10% скидки и привилегии.' },
]

const MASTER_STEPS = [
  { icon: UserPlus,    title: 'Регистрируйся бесплатно', desc: 'Создай профиль с портфолио и услугами за 5 минут. 0% комиссии.' },
  { icon: Clock,       title: 'Управляй расписанием',    desc: 'Настрой шаблон один раз — слоты создаются автоматически.' },
  { icon: TrendingUp,  title: 'Расти вместе с нами',     desc: 'Аналитика, отзывы, буст профиля — всё в одном кабинете.' },
]

export function HowItWorks() {
  return (
    <section className="border-t bg-background">
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="mb-12">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Как это работает</p>
          <h2 className="text-2xl font-medium text-foreground tracking-tight">Просто и понятно</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Для клиентов */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6 pb-4 border-b">
              Для клиентов
            </p>
            <div className="space-y-7">
              {CLIENT_STEPS.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-border bg-muted/50 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Для мастеров */}
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-6 pb-4 border-b border-violet-100">
              Для мастеров
            </p>
            <div className="space-y-7">
              {MASTER_STEPS.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-violet-100 bg-violet-50 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
