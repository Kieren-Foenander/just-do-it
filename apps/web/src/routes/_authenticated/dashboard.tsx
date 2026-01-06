import { api } from '@just-do-it/backend/convex/_generated/api'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { useState } from 'react'
import type { Id } from '@just-do-it/backend/convex/_generated/dataModel'

import UserMenu from '@/components/user-menu'
import { WeekPicker } from '@/components/week-picker'
import { CategoryPills, type Category } from '@/components/category-pills'
import { TaskCard, type Todo } from '@/components/task-card'
import { TaskFormDrawer } from '@/components/task-form-drawer'
import { Fab } from '@/components/fab'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    Id<'categories'> | 'all' | null
  >('all')
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  // Track which week is being viewed (for swipeable week picker)
  const [viewedWeekRange, setViewedWeekRange] = useState<{
    start: string
    end: string
  } | null>(null)

  // Fetch categories
  const categories = useQuery(api.categories.list) || []

  // Fetch todos for selected date
  const todosQueryResult = useQuery(
    api.todos.list,
    selectedCategoryId === 'all'
      ? { date: selectedDate }
      : {
          date: selectedDate,
          categoryId: selectedCategoryId as Id<'categories'>,
        }
  )
  const todos = todosQueryResult ?? []
  const isLoadingTodos = todosQueryResult === undefined

  // Fetch todos for week view (to show completion indicators)
  // Use viewed week range if available (from swipeable week picker), otherwise fall back to selected date's week
  const weekStart = (() => {
    if (viewedWeekRange) return viewedWeekRange.start
    const selected = new Date(selectedDate)
    const day = selected.getDay()
    const diff = selected.getDate() - day
    const start = new Date(selected.setDate(diff))
    return start.toISOString().split('T')[0]
  })()

  const weekEnd = (() => {
    if (viewedWeekRange) return viewedWeekRange.end
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    return end.toISOString().split('T')[0]
  })()

  const todosByDateRange = useQuery(api.todos.listByDateRange, {
    startDate: weekStart,
    endDate: weekEnd,
    categoryId:
      selectedCategoryId === 'all'
        ? undefined
        : (selectedCategoryId as Id<'categories'>),
  })

  // Calculate stats for week picker
  const todosByDate = (() => {
    const counts: Record<string, number> = {}
    if (
      todosByDateRange &&
      typeof todosByDateRange === 'object' &&
      !Array.isArray(todosByDateRange)
    ) {
      Object.keys(todosByDateRange).forEach((date) => {
        const todos = todosByDateRange[date as keyof typeof todosByDateRange]
        counts[date] = Array.isArray(todos) ? todos.length : 0
      })
    }
    return counts
  })()

  const completedByDate = (() => {
    const counts: Record<string, number> = {}
    if (
      todosByDateRange &&
      typeof todosByDateRange === 'object' &&
      !Array.isArray(todosByDateRange)
    ) {
      Object.keys(todosByDateRange).forEach((date) => {
        const todos = todosByDateRange[date as keyof typeof todosByDateRange]
        counts[date] = Array.isArray(todos)
          ? todos.filter((t: Todo) => t.completed).length
          : 0
      })
    }
    return counts
  })()

  // Mutations
  const createTodo = useMutation(api.todos.create)
  const updateTodo = useMutation(api.todos.update)
  const toggleTodo = useMutation(api.todos.toggle)
  const createCategory = useMutation(api.categories.create)

  const handleCreateTodo = async (data: {
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
  }) => {
    await createTodo(data)
  }

  const handleUpdateTodo = async (data: {
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
  }) => {
    if (editingTodo) {
      await updateTodo({
        id: editingTodo._id,
        ...data,
      })
      setEditingTodo(null)
    }
  }

  const handleToggleTodo = async (id: Id<'todos'>) => {
    await toggleTodo({ id, date: selectedDate })
  }

  const handleTaskClick = (id: Id<'todos'>) => {
    const todo = todos.find((t) => t._id === id)
    if (todo) {
      setEditingTodo(todo)
      setTaskDrawerOpen(true)
    }
  }

  const handleCreateCategory = async (data: {
    name: string
    emoji: string
    color: string
  }) => {
    await createCategory(data)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const categoryMap = (() => {
    const map = new Map<Id<'categories'>, Category>()
    categories.forEach((cat) => {
      map.set(cat._id, cat)
    })
    return map
  })()

  return (
    <div className="min-h-svh flex flex-col">
      {/* Mobile-first container */}
      <div className="flex-1 mx-auto w-full max-w-[430px] px-4 pb-24">
        {/* Header Section - Glass card effect */}
        <header className="pt-6 pb-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                })}
              </p>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {formatDate(selectedDate)}
              </h1>
            </div>
            <UserMenu />
          </div>
        </header>

        {/* Week Picker - Elevated card */}
        <div className="mb-5 bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-md border border-white/50">
          <WeekPicker
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            todosByDate={todosByDate}
            completedByDate={completedByDate}
            onWeekChange={(start, end) => setViewedWeekRange({ start, end })}
          />
        </div>

        {/* Divider with subtle gradient */}
        <div className="h-px bg-linear-to-r from-transparent via-primary/20 to-transparent mb-4" />

        {/* Category Pills */}
        <div className="mb-5">
          <CategoryPills
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
          />
        </div>

        {/* Task List Section */}
        <div className="space-y-3">
          {isLoadingTodos ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-gray-200" />
              ))}
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-sm font-medium text-foreground/60">
                No tasks for this day
              </p>
              <p className="text-xs text-foreground/40 mt-1">
                Tap the + button to add one!
              </p>
            </div>
          ) : (
            todos.map((todo) => {
              const category = todo.categoryId
                ? categoryMap.get(todo.categoryId)
                : undefined
              return (
                <TaskCard
                  key={todo._id}
                  todo={todo}
                  categoryColor={category?.color}
                  onToggle={handleToggleTodo}
                  onClick={handleTaskClick}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Fab
        onClick={() => {
          setEditingTodo(null)
          setTaskDrawerOpen(true)
        }}
      />

      {/* Task Form Drawer */}
      <TaskFormDrawer
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
        categories={categories}
        todo={editingTodo}
        onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  )
}
