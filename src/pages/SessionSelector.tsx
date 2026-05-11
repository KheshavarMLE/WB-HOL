import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag, ArrowLeft, RefreshCw, AlertCircle,
  Wrench, Database, ArrowRight,
} from 'lucide-react';
import ActiveUsersIndicator from '@/components/ActiveUsersIndicator';

const SessionSelector = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    session, products, cart, activeUsers, currentUser,
    isLoading, error, resetSession, isValid, getOnlineUsers,
  } = useSession(sessionId || null);

  const onlineUsers = getOnlineUsers();
  const sapCount = session?.sapItems?.length ?? 0;
  const rangeCount = session?.ranges?.length ?? 0;
  const publishedCount = session?.ranges?.filter(r => r.isPublished).length ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-pulse-subtle">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-accent animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Invalid Session</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'This demo session is invalid or has expired.'}
          </p>
          <Button onClick={() => navigate('/')} variant="hero">
            <ArrowLeft className="w-4 h-4" /> Generate New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
              <span>{sapCount} SAP item{sapCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{rangeCount} range{rangeCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{publishedCount} published</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Session</p>
              <p className="font-mono text-sm font-medium text-foreground">{sessionId}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetSession}>
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-5xl w-full text-center animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Choose Your System
          </h1>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Create items in SAP → Organise into ranges in WorkBench → Publish to Web View
          </p>

          {/* Flow indicator */}
          <div className="flex items-center justify-center gap-2 mb-10 text-sm text-muted-foreground">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">SAP Portal</span>
            <ArrowRight className="h-4 w-4" />
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">WorkBench PDP</span>
            <ArrowRight className="h-4 w-4" />
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">Web View</span>
          </div>

          <div className="flex justify-center mb-10">
            <ActiveUsersIndicator
              users={activeUsers}
              currentUserId={currentUser?.userId}
              showCount={true}
            />
          </div>

          {/* 3 Cards */}
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">

            {/* SAP Portal — Green */}
            <button
              onClick={() => navigate(`/session/${sessionId}/sap`)}
              className="group bg-card rounded-2xl p-8 border border-border/50 text-left transition-all duration-300 hover:border-[#00A74A]/60 shadow-card hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-5 group-hover:bg-green-200 transition-colors">
                <Database className="w-7 h-7 text-[#00A74A]" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">SAP Portal</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create items with item numbers, packaging info, and bill of materials
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{sapCount} item{sapCount !== 1 ? 's' : ''}</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00A74A]">
                  Enter
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>

            {/* WorkBench PDP — Blue */}
            <button
              onClick={() => navigate(`/session/${sessionId}/workbench`)}
              className="group bg-card rounded-2xl p-8 border border-border/50 text-left transition-all duration-300 hover:border-[#0066B3]/60 shadow-card hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-5 group-hover:bg-blue-200 transition-colors">
                <Wrench className="w-7 h-7 text-[#0066B3]" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">WorkBench PDP</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Organise items into ranges, manage content, and publish to the store
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {rangeCount} range{rangeCount !== 1 ? 's' : ''} · {publishedCount} live
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0066B3]">
                  Enter
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>

            {/* Web View — Red */}
            <button
              onClick={() => navigate(`/session/${sessionId}/webview`)}
              className="group bg-card rounded-2xl p-8 border border-border/50 text-left transition-all duration-300 hover:border-[#D2051E]/60 shadow-card hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mb-5 group-hover:bg-red-200 transition-colors">
                <ShoppingBag className="w-7 h-7 text-[#D2051E]" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">Web View Store</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Customer-facing storefront showing all published ranges and items
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{publishedCount} range{publishedCount !== 1 ? 's' : ''} live</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D2051E]">
                  View Store
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>

          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionSelector;
