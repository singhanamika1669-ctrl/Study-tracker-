import React, {useState} from 'react';
import {Download, Share, Smartphone, WifiOff, X} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  onShowToast?: (msg: string) => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({compact = false, onShowToast}) => {
  const {canInstall, isInstalled, isIOS, promptInstall} = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onShowToast?.('Study Tracker mobile app install ho raha hai!');
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstallClick()}
        aria-label="Install Study Tracker mobile app"
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition whitespace-nowrap ${
          compact
            ? 'h-10 bg-[#0c2340] px-3 text-xs text-white hover:bg-[#13335c] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400'
            : 'min-h-[44px] w-full bg-[#0c2340] px-4 py-2.5 text-sm text-white hover:bg-[#13335c] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400'
        }`}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{compact ? 'Install App' : 'Install Study Tracker App (PWA)'}</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-[#0f1b2d] dark:text-slate-100">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0c2340] text-sky-400">
                  <Smartphone className="h-4 w-4" />
                </span>
                <h3 className="font-display text-base font-extrabold">
                  Phone par Install Karein
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install instructions"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#0284c7]">1.</span>
                  <span>
                    Safari browser ke neeche{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                      <Share className="h-3.5 w-3.5" /> Share
                    </span>{' '}
                    button tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#0284c7]">2.</span>
                  <span>
                    Neeche scroll karke <strong>&ldquo;Add to Home Screen&rdquo;</strong> select
                    karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#0284c7]">3.</span>
                  <span>
                    Top right me <strong>&ldquo;Add&rdquo;</strong> tap karein — Study Tracker full
                    app ki tarah open hoga!
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#0284c7]">1.</span>
                  <span>
                    Chrome ya Edge me top-right <strong>Menu (⋮)</strong> ya address bar ka{' '}
                    <strong>Install icon</strong> tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#0284c7]">2.</span>
                  <span>
                    <strong>&ldquo;Install app&rdquo;</strong> ya{' '}
                    <strong>&ldquo;Add to Home screen&rdquo;</strong> par click karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#0284c7]">3.</span>
                  <span>App bina internet (offline mode) me bhi study logs &amp; timer chalayega.</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 min-h-[42px] w-full rounded-xl bg-[#0284c7] px-4 py-2 text-sm font-bold text-white"
            >
              Samajh Gaya
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-slate-900 px-4 py-2 text-center text-xs font-semibold text-amber-300"
    >
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="h-3.5 w-3.5" />
        Offline Mode Active · Tumhara study data device me safe save ho raha hai
      </span>
    </div>
  );
};
