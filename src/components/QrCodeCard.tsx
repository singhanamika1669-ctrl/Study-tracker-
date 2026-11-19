import React, {useEffect, useState} from 'react';
import QRCode from 'qrcode';
import {Check, Copy, Download, QrCode, RotateCcw} from 'lucide-react';
import {DEFAULT_APP_SHARE_URL} from '../types';

interface QrCodeCardProps {
  shareUrl: string;
  onUpdateShareUrl: (nextUrl: string) => void;
  onCopySuccess: (msg: string) => void;
}

export const QrCodeCard: React.FC<QrCodeCardProps> = ({
  shareUrl,
  onUpdateShareUrl,
  onCopySuccess,
}) => {
  const isLiveRemoteHost =
    typeof window !== 'undefined' &&
    Boolean(window.location.origin) &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1');

  const effectiveDefaultUrl = isLiveRemoteHost ? window.location.origin : DEFAULT_APP_SHARE_URL;

  const targetUrl =
    !shareUrl || (shareUrl === DEFAULT_APP_SHARE_URL && isLiveRemoteHost)
      ? effectiveDefaultUrl
      : shareUrl.trim() || effectiveDefaultUrl;
  const [urlDraft, setUrlDraft] = useState(targetUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrlDraft(targetUrl);
  }, [targetUrl]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      onCopySuccess('App link copy ho gaya!');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onCopySuccess('Link copy karne ke liye text select karein.');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'Study-Tracker-Download-QR.png';
    a.click();
    onCopySuccess('QR Code image download ho gayi!');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800/60">
        {qrDataUrl ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <img
              src={qrDataUrl}
              alt="Study Tracker Download QR Code"
              referrerPolicy="no-referrer"
              className="h-44 w-44 object-contain sm:h-48 sm:w-48"
            />
          </div>
        ) : (
          <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
            <QrCode className="h-12 w-12" />
          </div>
        )}

        <p className="font-display mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
          Scan QR to Download / Open Study Tracker
        </p>
        <p className="mt-1 max-w-xs break-all text-[11px] text-slate-500 dark:text-slate-400">
          {targetUrl}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0c2340] px-4 py-2 text-xs font-bold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Save QR Image
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = urlDraft.trim() || effectiveDefaultUrl;
          onUpdateShareUrl(cleaned);
        }}
        className="space-y-2"
      >
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          App / APK Download Link (QR Code update karne ke liye)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#3b5998] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="min-h-[38px] shrink-0 rounded-xl bg-[#0284c7] px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-95"
          >
            Update QR
          </button>
          <button
            type="button"
            onClick={() => {
              setUrlDraft(effectiveDefaultUrl);
              onUpdateShareUrl(effectiveDefaultUrl);
            }}
            title="Reset to default app link"
            className="flex min-h-[38px] shrink-0 items-center justify-center rounded-xl border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Phone ke camera ya QR scanner se scan karke seedha Study Tracker kholein ya apna APK link paste karke QR share karein.
        </p>
      </form>
    </div>
  );
};
