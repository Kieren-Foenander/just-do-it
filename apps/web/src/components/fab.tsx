import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FabProps {
  onClick: () => void;
  className?: string;
}

export function Fab({ onClick, className }: FabProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-40",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "transition-all hover:scale-110 active:scale-95",
        className
      )}
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}



