import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Id } from '@just-do-it/backend/convex/_generated/dataModel'
import type { Category } from './category-pills'
import type { Todo } from './task-card'

interface TaskFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  todo?: Todo | null
  onSubmit: (data: {
    title: string
    emoji: string
    categoryId?: Id<'categories'>
    dueDate: string
    dueTime: string | null
    recurrence:
      | 'none'
      | 'daily'
      | 'weekly'
      | 'biweekly'
      | 'monthly'
      | 'quarterly'
  }) => void
  onCreateCategory?: (data: {
    name: string
    emoji: string
    color: string
  }) => void
  trigger?: React.ReactNode
}

const commonEmojis = [
  '☕',
  '🍳',
  '💆',
  '🏠',
  '💼',
  '📚',
  '🏃',
  '🧘',
  '🎯',
  '💡',
  '🎨',
  '🎵',
  '📱',
  '💻',
  '🚗',
  '🛒',
  '🍎',
  '💊',
  '🧹',
  '🌱',
  '📝',
  '✉️',
  '📞',
  '💬',
  '🎁',
  '🎉',
  '⭐',
  '❤️',
  '🔥',
  '✨',
]

const categoryColors = [
  '#E8D5FF',
  '#FFD5E8',
  '#D5E8FF',
  '#D5FFE8',
  '#FFE8D5',
  '#FFD5D5',
  '#D5FFFF',
  '#FFF5D5',
  '#E8E8FF',
  '#FFE8FF',
]

const recurrenceOptions = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
] as const

type RecurrenceValue = (typeof recurrenceOptions)[number]['value']

export function TaskFormDrawer({
  open,
  onOpenChange,
  categories,
  todo,
  onSubmit,
  onCreateCategory,
  trigger,
}: TaskFormDrawerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showCategoryEmojiPicker, setShowCategoryEmojiPicker] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm({
    defaultValues: {
      title: todo?.title ?? '',
      emoji: todo?.emoji ?? '📝',
      categoryId: (todo?.categoryId ??
        categories[0]?._id ??
        null) as Id<'categories'> | null,
      dueDate: todo?.dueDate ?? today,
      dueTime: todo?.dueTime ?? (null as string | null),
      recurrence: (todo?.recurrence ?? 'none') as RecurrenceValue,
    },
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) return

      onSubmit({
        title: value.title.trim(),
        emoji: value.emoji,
        categoryId: value.categoryId ?? undefined,
        dueDate: value.dueDate,
        dueTime: value.dueTime,
        recurrence: value.recurrence,
      })

      if (!todo) {
        form.reset()
      }
      onOpenChange(false)
    },
  })

  const categoryForm = useForm({
    defaultValues: {
      name: '',
      emoji: '📁',
      color: categoryColors[0],
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return

      onCreateCategory?.({
        name: value.name.trim(),
        emoji: value.emoji,
        color: value.color,
      })

      categoryForm.reset()
      setShowCategoryForm(false)
    },
  })

  // Reset task form when todo changes (edit mode) or drawer opens for new task
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        title: todo?.title ?? '',
        emoji: todo?.emoji ?? '📝',
        categoryId: (todo?.categoryId ??
          categories[0]?._id ??
          null) as Id<'categories'> | null,
        dueDate: todo?.dueDate ?? today,
        dueTime: todo?.dueTime ?? null,
        recurrence: (todo?.recurrence ?? 'none') as RecurrenceValue,
      })
    }
    onOpenChange(isOpen)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{todo ? 'Edit Task' : 'New Task'}</DrawerTitle>
          <DrawerDescription>
            {todo ? 'Update your task details' : 'Create a new task'}
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <form.Field name="title">
                {(field) => (
                  <Input
                    id="title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter task title"
                  />
                )}
              </form.Field>
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label>Emoji</Label>
              <form.Field name="emoji">
                {(field) => (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-2xl shadow-sm border-2 border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      {field.state.value}
                    </button>
                    {showEmojiPicker && (
                      <div className="flex-1 grid grid-cols-8 gap-2 p-3 bg-white/60 rounded-xl border border-border">
                        {commonEmojis.map((e) => (
                          <button
                            type="button"
                            key={e}
                            onClick={() => {
                              field.handleChange(e)
                              setShowEmojiPicker(false)
                            }}
                            className="w-8 h-8 text-xl hover:scale-110 transition-transform"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category (optional)</Label>
                {onCreateCategory && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    {showCategoryForm ? 'Cancel' : '+ New Category'}
                  </button>
                )}
              </div>

              {showCategoryForm && onCreateCategory ? (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3 border border-border">
                  <categoryForm.Field name="name">
                    {(field) => (
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Category name"
                        className="bg-background"
                      />
                    )}
                  </categoryForm.Field>

                  <div className="flex items-center gap-3">
                    <categoryForm.Field name="emoji">
                      {(field) => (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setShowCategoryEmojiPicker(
                                !showCategoryEmojiPicker
                              )
                            }
                            className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-xl border border-border hover:border-primary/40 transition-colors"
                          >
                            {field.state.value}
                          </button>
                          {showCategoryEmojiPicker && (
                            <div className="grid grid-cols-6 gap-1 p-2 bg-background rounded-lg border border-border max-w-[200px]">
                              {commonEmojis.slice(0, 18).map((e) => (
                                <button
                                  type="button"
                                  key={e}
                                  onClick={() => {
                                    field.handleChange(e)
                                    setShowCategoryEmojiPicker(false)
                                  }}
                                  className="w-7 h-7 text-lg hover:scale-110 transition-transform"
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </categoryForm.Field>

                    <categoryForm.Field name="color">
                      {(field) => (
                        <div className="flex gap-1 flex-wrap">
                          {categoryColors.map((color) => (
                            <button
                              type="button"
                              key={color}
                              onClick={() => field.handleChange(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                field.state.value === color
                                  ? 'border-foreground scale-110'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </categoryForm.Field>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => categoryForm.handleSubmit()}
                    className="w-full"
                  >
                    Create Category
                  </Button>
                </div>
              ) : (
                <form.Field name="categoryId">
                  {(field) => (
                    <Select
                      value={field.state.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.handleChange(
                          value ? (value as Id<'categories'>) : null
                        )
                      }}
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </form.Field>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <form.Field name="dueDate">
                {(field) => (
                  <Input
                    id="dueDate"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </div>

            {/* Due Time */}
            <div className="space-y-2">
              <Label htmlFor="dueTime">Time (optional)</Label>
              <form.Field name="dueTime">
                {(field) => (
                  <>
                    <Input
                      id="dueTime"
                      type="time"
                      value={field.state.value || ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value || null)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => field.handleChange(null)}
                      className="text-xs"
                    >
                      Clear time (all-day)
                    </Button>
                  </>
                )}
              </form.Field>
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label htmlFor="recurrence">Repeat</Label>
              <form.Field name="recurrence">
                {(field) => (
                  <Select
                    id="recurrence"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(e.target.value as RecurrenceValue)
                    }
                  >
                    {recurrenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              </form.Field>
            </div>
          </div>

          <DrawerFooter>
            <form.Subscribe
              selector={(state) => [
                state.canSubmit,
                state.isSubmitting,
                state.values.title,
              ]}
            >
              {([canSubmit, isSubmitting, title]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || !(title as string).trim()}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : todo
                      ? 'Update Task'
                      : 'Create Task'}
                </Button>
              )}
            </form.Subscribe>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
