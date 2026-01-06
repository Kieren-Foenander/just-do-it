import { cn } from "@/lib/utils";
import type { Id } from "@just-do-it/backend/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";

export interface Todo {
  _id: Id<"todos">;
  title: string;
  emoji: string;
  categoryId?: Id<"categories">; // optional category
  dueDate: string;
  dueTime: string | null;
  recurrence: string;
  completed: boolean;
  completedAt: number | null;
}

interface TaskCardProps {
  todo: Todo;
  categoryColor?: string;
  onToggle: (id: Id<"todos">) => void;
  onClick?: (id: Id<"todos">) => void;
}

// Vibrant pastel colors for task cards - expanded palette for more variety
const taskColors = [
  "#FFE5B4", // warm yellow
  "#FFD5E8", // soft pink
  "#E8D5FF", // lavender
  "#D5FFE8", // mint green
  "#D5E8FF", // sky blue
  "#FFE8D5", // peach
  "#E8FFD5", // lime
  "#FFD5D5", // coral
  "#D5E8E8", // cyan
  "#F0D5FF", // light purple
  "#D5F0FF", // light blue
  "#FFF0D5", // cream
];

// Get a consistent color based on category or todo ID
function getTaskColor(categoryColor?: string, todoId?: string): string {
  if (categoryColor) {
    return categoryColor;
  }
  // Use todo ID to get a consistent color with better distribution
  if (todoId) {
    // Improved hash function for better color distribution
    let hash = 0;
    for (let i = 0; i < todoId.length; i++) {
      const char = todoId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use absolute value and modulo to ensure even distribution
    return taskColors[Math.abs(hash) % taskColors.length];
  }
  return taskColors[0];
}

function formatTime(time: string | null): string {
  if (!time) return "All day";
  
  // Convert 24h to 12h format
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function TaskCard({ todo, categoryColor, onToggle, onClick }: TaskCardProps) {
  const bgColor = getTaskColor(categoryColor, todo._id);

  return (
    <div
      onClick={() => onClick?.(todo._id)}
      className={cn(
        "w-full rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all",
        "hover:shadow-md active:scale-[0.98]",
        todo.completed && "opacity-60"
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* Emoji icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-2xl shadow-sm">
        {todo.emoji}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium mb-0.5 text-slate-600">
          {formatTime(todo.dueTime)}
        </div>
        <div
          className={cn(
            "text-sm font-semibold truncate text-slate-800",
            todo.completed && "line-through"
          )}
        >
          {todo.title}
        </div>
      </div>

      {/* Checkbox */}
      <div
        className="flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo._id);
        }}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            todo.completed
              ? "bg-accent border-accent"
              : "bg-white/80 border-foreground/20"
          )}
        >
          {todo.completed && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

