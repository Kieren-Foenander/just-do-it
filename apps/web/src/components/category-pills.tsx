import { cn } from '@/lib/utils'
import type { Id } from '@just-do-it/backend/convex/_generated/dataModel'

export interface Category {
  _id: Id<'categories'>
  name: string
  emoji: string
  color: string
}

interface CategoryPillsProps {
  categories: Category[]
  selectedCategoryId: Id<'categories'> | 'all' | null
  onCategorySelect: (categoryId: Id<'categories'> | 'all') => void
}

export function CategoryPills({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 px-0.5">
      <button
        onClick={() => onCategorySelect('all')}
        className={cn(
          'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          selectedCategoryId === 'all'
            ? 'bg-primary text-white shadow-md shadow-primary/25'
            : 'bg-white/80 text-foreground/60 hover:bg-white hover:shadow-sm border border-white/50'
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category._id}
          onClick={() => onCategorySelect(category._id)}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            selectedCategoryId === category._id
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'bg-white/80 text-foreground/60 hover:bg-white hover:shadow-sm border border-white/50'
          )}
        >
          <span>{category.emoji}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  )
}
