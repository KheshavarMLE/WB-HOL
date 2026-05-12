import { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession, encodeSessionSnapshot } from '@/hooks/useSession';
import { Copy, Check, QrCode, RefreshCw, ArrowRight, Globe, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const SESSION_STORAGE_PREFIX = 'demo_session_';

const LandingPage = () => {
  const { createSession } = useSession(null);
  const [generatedSessionId, setGeneratedSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  // Build the shareable URL — includes a ?snap= param so recipients on
  // any device/browser can load the session content without a backend.
  const getSessionUrl = useCallback(() => {
    if (!generatedSessionId) return '';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const base = `${cleanBase}/session/${generatedSessionId}`;

    // Encode current session state for cross-device sharing
    try {
      const raw = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${generatedSessionId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const snap = encodeSessionSnapshot(parsed);
        return `${base}?snap=${snap}`;
      }
    } catch {}

    return base;
  }, [generatedSessionId, baseUrl]);

  const handleGenerateSession = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const newId = createSession();
      setGeneratedSessionId(newId);
      setIsGenerating(false);
      toast.success('Demo session created! Share the link or QR code.');
    }, 300);
  }, [createSession]);

  const handleCopyLink = async () => {
    const url = getSessionUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied! Anyone with this link can open the session.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy — please copy the link manually.');
    }
  };

  // Refresh the URL whenever session data changes (e.g., after coming back
  // to landing page) so the snap is always up to date.
  const [, forceRefresh] = useState(0);
  useEffect(() => {
    if (!generatedSessionId) return;
    const key = `${SESSION_STORAGE_PREFIX}${generatedSessionId}`;
    const handler = (e: StorageEvent) => {
      if (e.key === key) setForceRefresh(n => n + 1);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [generatedSessionId]);

  function setForceRefresh(fn: (n: number) => number) {
    forceRefresh(fn);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-display font-bold text-foreground">ProductDemo</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
            Experience the Product{' '}
            <span className="text-gradient">Management Workflow</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto">
            Generate a session and share the link — anyone can open it instantly, no login required.
          </p>

          {!generatedSessionId ? (
            <Button
              variant="hero"
              size="xl"
              onClick={handleGenerateSession}
              disabled={isGenerating}
              className="group"
            >
              {isGenerating ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <>Generate New Demo Session <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>
              )}
            </Button>
          ) : (
            <div className="animate-scale-in space-y-6">

              {/* How sharing works — clear callout */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">This link works on any device</p>
                    <p className="text-xs text-green-700 mt-1">
                      The session state is embedded in the link. Anyone who opens it will see all your SAP items, ranges, and published content — no login needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Base URL Config */}
              <div className="bg-secondary/50 rounded-xl p-4 max-w-md mx-auto text-left">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  Base URL (update to your deployed domain)
                </label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://your-domain.com"
                  className="font-mono text-sm"
                />
              </div>

              {/* QR Code */}
              <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 inline-block">
                <QRCodeSVG
                  value={getSessionUrl()}
                  size={220}
                  level="M"
                  includeMargin
                  bgColor="transparent"
                  fgColor="currentColor"
                  className="text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-3">Scan to open on any device</p>
              </div>

              {/* Session Link */}
              <div className="bg-secondary/50 rounded-xl p-4 max-w-md mx-auto text-left">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Shareable Session Link</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-foreground truncate flex-1 bg-white rounded px-2 py-1.5 border border-border">
                    {getSessionUrl()}
                  </p>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0 w-9 h-9"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Session ID: <span className="font-mono font-semibold">{generatedSessionId}</span>
                  {' · '}Expires in 24 hours
                </p>
              </div>

              {/* How to use */}
              <div className="text-left max-w-sm mx-auto space-y-3">
                <p className="text-sm font-semibold text-foreground">How to share:</p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  {[
                    'Create your SAP items and publish ranges in WorkBench',
                    'Copy the link above or share the QR code',
                    'Recipients open it on any browser — no account needed',
                    'They see all your published content in the Web View',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={handleGenerateSession}
                disabled={isGenerating}
                className="mt-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate New Session
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-12">
            Session state is encoded directly in the link · No server or login required
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
