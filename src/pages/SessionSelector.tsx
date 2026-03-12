import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft, RefreshCw, AlertCircle, Wrench, Database } from 'lucide-react';
import ActiveUsersIndicator from '@/components/ActiveUsersIndicator';

const SessionSelector = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { 
    session, 
    products, 
    cart, 
    activeUsers, 
    currentUser,
    isLoading, 
    error, 
    resetSession, 
    isValid,
    getOnlineUsers,
  } = useSession(sessionId || null);

  const onlineUsers = getOnlineUsers();

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
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Invalid Session
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || 'This demo session is invalid or has expired. Please generate a new session.'}
          </p>
          <Button onClick={() => navigate('/')} variant="hero">
            <ArrowLeft className="w-4 h-4" />
            Generate New Session
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
            {/* Session Stats */}
            <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
              <span>{products.length} product{products.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Cart: {cart.itemCount}</span>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Session</p>
              <p className="font-mono text-sm font-medium text-foreground">{sessionId}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetSession}>
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full text-center animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Choose Your System
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Switch between systems to see how product data flows in real-time
          </p>
          
          {/* Active Users Indicator */}
          <div className="flex justify-center mb-10">
            <ActiveUsersIndicator 
              users={activeUsers} 
              currentUserId={currentUser?.userId}
              showCount={true}
            />
          </div>

          {/* System Cards - 3 Cards Layout */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* SAP Portal Card - Green */}
            <button
              onClick={() => navigate(`/session/${sessionId}/sap`)}
              className="group bg-card rounded-2xl p-8 border border-border/50 text-left transition-all duration-300 hover:border-[#00A74A]/50 shadow-card hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-[#00A74A]/10 flex items-center justify-center mb-5 group-hover:bg-[#00A74A]/20 transition-colors">
                <Database className="w-7 h-7 text-[#00A74A]" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                SAP Portal
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Item & material management with packaging and BOM
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#00A74A]">
                Enter SAP
                <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
            
            {/* WorkBench PDP Card - Blue */}
            <button
              onClick={() => navigate(`/session/${sessionId}/workbench`)}
              className="group bg-card rounded-2xl p-8 border border-border/50 text-left transition-all duration-300 hover:border-[hsl(var(--workbench))]/50 shadow-card hover:shadow-[var(--shadow-hover-blue)] hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--workbench))]/10 flex items-center justify-center mb-5 group-hover:bg-[hsl(var(--workbench))]/20 transition-colors">
                <Wrench className="w-7 h-7 text-[hsl(var(--workbench))]" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                WorkBench PDP
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Chapter & range management with yellow linking
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--workbench))]">
                Enter WorkBench
                <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            {/* Web View Card - Red */}
            <button
              onClick={() => navigate(`/session/${sessionId}/webview`)}
              className="group bg-card rounded-2xl p-8 border border-border/50 text-left transition-all duration-300 hover:border-accent/50 shadow-card hover:shadow-hover hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-accent/10 transition-colors">
                <ShoppingBag className="w-7 h-7 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Web View Store
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Published content with chapter navigation
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                View Store
                <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
          
          {/* Session Info Footer */}
          <p className="text-sm text-muted-foreground mt-10">
            {products.length} product{products.length !== 1 ? 's' : ''} in library • {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} in your cart
          </p>
        </div>
      </main>
    </div>
  );
};

export default SessionSelector;
