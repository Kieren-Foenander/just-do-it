import { api } from "@just-do-it/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function UserMenu() {
  const user = useQuery(api.auth.getCurrentUser);

  // Get initials for avatar
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200",
          "bg-white/80 hover:bg-white shadow-sm hover:shadow-md",
          "border border-white/50 backdrop-blur-sm",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "text-xs font-semibold text-foreground/80"
        )}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-[10px] font-bold text-white">
          {initials}
        </div>
        <span className="max-w-[80px] truncate">{user?.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-white/95 backdrop-blur-md border-white/50 shadow-xl min-w-[200px]"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-foreground/50 font-semibold">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-primary/10" />
          <DropdownMenuItem className="flex items-center gap-2 text-foreground/70 cursor-default">
            <User className="w-3.5 h-3.5 text-primary/60" />
            <span className="truncate">{user?.email}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-primary/10" />
          <DropdownMenuItem
            variant="destructive"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    location.reload();
                  },
                },
              });
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
