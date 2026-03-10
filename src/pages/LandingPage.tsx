import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/hooks/useSession';
import { Copy, Check, QrCode, RefreshCw, ArrowRight, Globe } from 'lucide-react';
import { toast } from 'sonner';

const LandingPage = () => {
  const { createSession } = useSession(null);
  const [generatedSessionId, setGeneratedSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  const handleGenerateSession = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const newId = createSession();
      setGeneratedSessionId(newId);
      setIsGenerating(false);
      toast.success('Demo session created!');
    }, 300);
  }, [createSession]);

  const getSessionUrl = () => {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    return `${cleanBase}/session/${generatedSessionId}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getSessionUrl());
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">ProductDemo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center animate-fade-in">
          {/* Hero Text */}
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
            Experience the Product{' '}
            <span className="text-gradient">Management Workflow</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto">
            Generate a demo session and explore how product data flows from management to customer experience
          </p>

          {!generatedSessionId ? (
            /* Generate Session Button */
            <Button
              variant="hero"
              size="xl"
              onClick={handleGenerateSession}
              disabled={isGenerating}
              className="group"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate New Demo Session
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          ) : (
            /* QR Code Display */
            <div className="animate-scale-in space-y-8">
              {/* Base URL Config */}
              <div className="bg-secondary/50 rounded-xl p-4 max-w-md mx-auto text-left">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  Base URL for QR Code
                </label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://your-domain.com"
                  className="font-mono text-sm"
                />
              </div>

              {/* QR Code Card */}
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 inline-block">
                <QRCodeSVG
                  value={getSessionUrl()}
                  size={240}
                  level="H"
                  includeMargin
                  bgColor="transparent"
                  fgColor="currentColor"
                  className="text-foreground"
                />
              </div>

              {/* Session Link */}
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center gap-3 max-w-md mx-auto">
                <div className="flex-1 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Session Link</p>
                  <p className="text-sm font-mono text-foreground truncate">
                    {getSessionUrl()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-left max-w-sm mx-auto space-y-3">
                <p className="text-sm font-medium text-foreground">How to use:</p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold shrink-0">1</span>
                    Share this QR code with participants
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold shrink-0">2</span>
                    Users scan to access the demo instantly
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold shrink-0">3</span>
                    Choose between WorkBench or Web View
                  </li>
                </ol>
              </div>

              {/* Generate New Button */}
              <Button
                variant="outline"
                onClick={handleGenerateSession}
                disabled={isGenerating}
                className="mt-4"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate New Session
              </Button>
            </div>
          )}

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground mt-12">
            Sessions are stored locally in your browser • Share the link for others to start their own session
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
