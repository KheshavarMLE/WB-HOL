import { ActiveUser } from '@/types/product';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users } from 'lucide-react';

interface ActiveUsersIndicatorProps {
  users: ActiveUser[];
  currentUserId?: string;
  variant?: 'light' | 'dark';
  showCount?: boolean;
}

const ActiveUsersIndicator = ({ 
  users, 
  currentUserId, 
  variant = 'dark',
  showCount = true 
}: ActiveUsersIndicatorProps) => {
  const onlineUsers = users.filter(u => u.isOnline);
  
  if (onlineUsers.length === 0) return null;
  
  const isLight = variant === 'light';
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isLight ? 'bg-white/10' : 'bg-secondary'
    }`}>
      {showCount && (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className={`text-sm ${isLight ? 'text-white/80' : 'text-muted-foreground'}`}>
            {onlineUsers.length} active
          </span>
        </div>
      )}
      
      <div className="flex items-center -space-x-1.5">
        {onlineUsers.slice(0, 4).map((user) => (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 cursor-default transition-transform hover:scale-110 hover:z-10 ${
                  isLight ? 'border-white/20' : 'border-background'
                }`}
                style={{ backgroundColor: user.color }}
              >
                {user.userId === currentUserId 
                  ? 'You' 
                  : user.username.charAt(0).toUpperCase()
                }
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {user.userId === currentUserId ? 'You' : user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.userId === currentUserId 
                  ? 'Currently active' 
                  : `Last active: ${formatLastActive(user.lastActive)}`
                }
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {onlineUsers.length > 4 && (
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              isLight 
                ? 'bg-white/20 text-white border-white/20' 
                : 'bg-muted text-muted-foreground border-background'
            }`}
          >
            +{onlineUsers.length - 4}
          </div>
        )}
      </div>
    </div>
  );
};

function formatLastActive(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return 'a while ago';
}

export default ActiveUsersIndicator;
