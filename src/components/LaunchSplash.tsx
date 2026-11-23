import React, {useEffect, useState} from 'react';
import {Anchor, GraduationCap, Shield} from 'lucide-react';
import {AppTheme} from '../types';
import {getThemeMeta} from '../utils/themeConfig';
import {FighterJetSvg, IafFinFlashSvg} from './FighterJetIcon';

interface LaunchSplashProps {
  theme: AppTheme;
  onDone: () => void;
}

export const LaunchSplash: React.FC<LaunchSplashProps> = ({theme, onDone}) => {
  const [exiting, setExiting] = useState(false);
  const meta = getThemeMeta(theme);

  useEffect(() => {
    const t1 = window.setTimeout(() => setExiting(true), 3450);
    const t2 = window.setTimeout(() => onDone(), 4050);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  const renderEmblem = () => {
    switch (theme) {
      case 'airforce':
        return <FighterJetSvg className="h-5 w-5 -rotate-12 text-sky-300" />;
      case 'army':
        return <Shield className="h-5 w-5 text-amber-300" />;
      case 'navy':
        return <Anchor className="h-5 w-5 text-cyan-300" />;
      default:
        return <GraduationCap className="h-5 w-5 text-indigo-300" />;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${meta.heroGradient} px-6 text-center text-white transition-all duration-700 ${
        exiting ? 'pointer-events-none scale-105 opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      {/* Background Hero Texture */}
      {meta.heroImage && (
        <img
          src={meta.heroImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
        />
      )}

      {/* Radial Glow & Tactical Rotating Radar Rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="animate-radar-pulse absolute h-80 w-80 rounded-full blur-3xl sm:h-[26rem] sm:w-[26rem]"
          style={{backgroundColor: `${meta.accentHex}38`}}
        />
        <div className="animate-radar-spin h-[300px] w-[300px] rounded-full border border-dashed border-white/15 sm:h-[400px] sm:w-[400px]" />
        <div className="absolute h-[220px] w-[220px] rounded-full border border-white/10 sm:h-[290px] sm:w-[290px]" />
      </div>

      {meta.showTricolour && (
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-md"
        />
      )}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        {/* Glowing Emblem Crest */}
        <div className="animate-splash-emblem relative">
          <div
            className="absolute -inset-2 rounded-3xl opacity-60 blur-lg"
            style={{backgroundColor: meta.accentHex}}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-white/30 shadow-2xl"
            style={{backgroundColor: meta.primaryHex}}
          >
            <img
              src="/icon.svg"
              alt="Study Tracker Emblem"
              className="h-16 w-16 rounded-2xl drop-shadow-md"
            />
          </div>
        </div>

        {/* App Title & Subtitle */}
        <div className="animate-splash-rise space-y-2">
          <p className="text-[11px] font-bold tracking-[0.28em] text-sky-200/90 uppercase">
            {meta.name} Edition
          </p>
          <h1 className="font-display bg-gradient-to-b from-white via-white to-slate-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent drop-shadow-sm sm:text-6xl">
            Study Tracker
          </h1>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-200 uppercase">
            Class 9–12 · UP Board · NDA Mission
          </p>
        </div>

        {/* Sleek Animated Launch Progress Line */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/15">
          <div
            className="animate-splash-bar h-full w-full rounded-full"
            style={{
              background: meta.showTricolour
                ? 'linear-gradient(90deg, #FF9933, #ffffff, #138808)'
                : `linear-gradient(90deg, ${meta.accentHex}, #a5b4fc)`,
            }}
          />
        </div>

        {/* Directly Underneath: Design & Created by Atharv Singh */}
        <div className="animate-splash-rise-delay flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-black/35 px-6 py-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {renderEmblem()}
            {meta.showTricolour && <IafFinFlashSvg className="h-3.5 w-6 rounded-[2px]" />}
          </div>
          <p className="text-xs font-extrabold tracking-[0.22em] text-amber-300 uppercase sm:text-sm">
            Design &amp; Created by Atharv Singh
          </p>
          <p className="text-[11px] font-medium text-slate-200/85">{meta.taglineHi}</p>
        </div>
      </div>
    </div>
  );
};
