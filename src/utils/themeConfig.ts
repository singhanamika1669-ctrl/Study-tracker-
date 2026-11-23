import {AppTheme, BoardMedium, StudentClass, StudyTrack, Subject} from '../types';

export interface ThemeMeta {
  id: AppTheme;
  name: string;
  shortLabel: string;
  tagline: string;
  taglineHi: string;
  primaryHex: string;
  accentHex: string;
  heroImage: string | null;
  hudImage: string | null;
  heroAlt: string;
  heroGradient: string;
  crestImage: string | null;
  showTricolour: boolean;
  rankTitle: string;
  sessionWord: string;
  hudTitle: string;
  focusStatusActive: string;
  progressHeading: string;
  quickLogHeading: string;
  planHeading: string;
  debriefHeading: string;
  gpsHudTitle: string;
  defaultExamLabel: string;
}

export const APP_THEMES: Record<AppTheme, ThemeMeta> = {
  airforce: {
    id: 'airforce',
    name: 'Indian Air Force',
    shortLabel: 'Air Force',
    tagline: 'Touch the Sky with Glory · Fighter Squadron Focus',
    taglineHi: 'नभः स्पृशं दीप्तम् · भारतीय वायु सेना मिशन',
    primaryHex: '#0c2340',
    accentHex: '#0284c7',
    heroImage: '/src/assets/images/iaf_tejas_himalayas_1795071299389.jpg',
    hudImage: '/src/assets/images/iaf_stratosphere_night_1795071299650.jpg',
    heroAlt: 'Indian Air Force HAL Tejas fighter jets flying over Himalayas',
    heroGradient: 'from-[#08101c] via-[#0c2340] to-[#0284c7]',
    crestImage: '/src/assets/images/iaf_squadron_crest_1795071260293.jpg',
    showTricolour: true,
    rankTitle: 'Pilot',
    sessionWord: 'Sortie',
    hudTitle: 'IAF Focus Cockpit',
    focusStatusActive: 'Cockpit Focus ON... Touch the Sky!',
    progressHeading: 'Aaj ki Sortie (Study Progress)',
    quickLogHeading: 'Quick Sortie Log',
    planHeading: 'Aaj ka Flight Plan (Timetable)',
    debriefHeading: 'Flight Debrief & Weak Topics',
    gpsHudTitle: 'IAF Ground Run HUD',
    defaultExamLabel: 'NDA Air Force Flying + 11th Board',
  },
  army: {
    id: 'army',
    name: 'Indian Army',
    shortLabel: 'Army',
    tagline: 'Service Before Self · Ground Discipline & Grit',
    taglineHi: 'सेवा परमो धर्मः · भारतीय थल सेना अनुशासन',
    primaryHex: '#283618',
    accentHex: '#b45309',
    heroImage: '/src/assets/images/indian_army_mountain_patrol_1795442782183.jpg',
    hudImage: '/src/assets/images/indian_army_mountain_patrol_1795442782183.jpg',
    heroAlt: 'Indian Army mountain patrol convoy in the Himalayas',
    heroGradient: 'from-[#141d0c] via-[#283618] to-[#854d0e]',
    crestImage: null,
    showTricolour: true,
    rankTitle: 'Cadet',
    sessionWord: 'Drill',
    hudTitle: 'Army Command Bunker',
    focusStatusActive: 'Field Discipline ON... Service Before Self!',
    progressHeading: 'Aaj ka Study Drill (Progress)',
    quickLogHeading: 'Quick Drill Log',
    planHeading: 'Aaj ka Operation Plan (Timetable)',
    debriefHeading: 'Field Debrief & Weak Topics',
    gpsHudTitle: 'Army PT Ground GPS HUD',
    defaultExamLabel: 'NDA Army Wing + 11th Board',
  },
  navy: {
    id: 'navy',
    name: 'Indian Navy',
    shortLabel: 'Navy',
    tagline: 'Sham No Varunah · Deep Sea Precision',
    taglineHi: 'शं नो वरुणः · भारतीय नौसेना संकल्प',
    primaryHex: '#0a192f',
    accentHex: '#0891b2',
    heroImage: '/src/assets/images/indian_navy_aircraft_carrier_1795442782188.jpg',
    hudImage: '/src/assets/images/indian_navy_aircraft_carrier_1795442782188.jpg',
    heroAlt: 'Indian Navy aircraft carrier and destroyer fleet at sunrise',
    heroGradient: 'from-[#050d1a] via-[#0a192f] to-[#0e7490]',
    crestImage: null,
    showTricolour: true,
    rankTitle: 'Officer',
    sessionWord: 'Watch',
    hudTitle: 'Naval Bridge Console',
    focusStatusActive: 'Bridge Watch ON... Sham No Varunah!',
    progressHeading: 'Aaj ka Sea Watch (Study Progress)',
    quickLogHeading: 'Quick Watch Log',
    planHeading: 'Aaj ka Naval Chart (Timetable)',
    debriefHeading: 'Bridge Log & Weak Topics',
    gpsHudTitle: 'Naval PT Track GPS HUD',
    defaultExamLabel: 'NDA Naval Wing + 11th Board',
  },
  default: {
    id: 'default',
    name: 'Classic Academic',
    shortLabel: 'Default',
    tagline: 'Focused Board & Competitive Study Workspace',
    taglineHi: 'स्वच्छ और शांत पढ़ाई डैशबोर्ड',
    primaryHex: '#312e81',
    accentHex: '#4f46e5',
    heroImage: null,
    hudImage: null,
    heroAlt: 'Academic study banner',
    heroGradient: 'from-slate-900 via-[#1e293b] to-[#3730a3]',
    crestImage: null,
    showTricolour: false,
    rankTitle: 'Champion',
    sessionWord: 'Session',
    hudTitle: 'Focus Timer Console',
    focusStatusActive: 'Deep Focus ON... Keep Going!',
    progressHeading: 'Aaj ki Padhai Progress',
    quickLogHeading: 'Quick Study Log',
    planHeading: 'Aaj ka Study Timetable',
    debriefHeading: 'Daily Review & Weak Topics',
    gpsHudTitle: 'GPS Running HUD',
    defaultExamLabel: '11th Board + Competitive Target',
  },
};

export function getThemeMeta(theme: AppTheme | undefined): ThemeMeta {
  return APP_THEMES[theme || 'airforce'] || APP_THEMES.airforce;
}

export function trackIncludesNda(track: StudyTrack): boolean {
  return track !== 'class_only';
}

export function trackIncludesClass(track: StudyTrack): boolean {
  return track !== 'nda_only';
}

export function getTrackDisplayLabel(
  studentClass: StudentClass,
  studyTrack: StudyTrack,
  boardMedium: BoardMedium,
): string {
  const med = boardMedium === 'up_hindi' ? 'UP Board Hindi' : 'English Medium';
  switch (studyTrack) {
    case 'class_only':
      return `Class ${studentClass} (${med})`;
    case 'nda_only':
      return `NDA Defence Exam (${med})`;
    case 'class_9_nda':
      return `Class 9 + NDA Foundation (${med})`;
    case 'class_10_nda':
      return `Class 10 + NDA Foundation (${med})`;
    case 'class_11_nda':
      return `Class 11 + NDA Target (${med})`;
    case 'class_12_nda':
      return `Class 12 + NDA Target (${med})`;
  }
}

export function getSubjectsForProfile(
  studentClass: StudentClass,
  studyTrack: StudyTrack,
  boardMedium: BoardMedium,
): Subject[] {
  const isHindi = boardMedium === 'up_hindi';
  const effectiveClass =
    studyTrack === 'class_9_nda'
      ? '9'
      : studyTrack === 'class_10_nda'
        ? '10'
        : studyTrack === 'class_11_nda'
          ? '11'
          : studyTrack === 'class_12_nda'
            ? '12'
            : studentClass;

  if (studyTrack === 'nda_only') {
    return [
      {
        id: 'sub_maths',
        name: isHindi ? 'NDA गणित (Maths 300 Marks)' : 'NDA Mathematics (300 Marks)',
        totalChapters: 22,
        doneChapters: 0,
        color: '#0284c7',
      },
      {
        id: 'sub_phy',
        name: isHindi ? 'भौतिक विज्ञान (Physics GAT)' : 'Physics (NDA GAT)',
        totalChapters: 14,
        doneChapters: 0,
        color: '#4f46e5',
      },
      {
        id: 'sub_chem',
        name: isHindi ? 'रसायन व जीव विज्ञान (Chem/Bio)' : 'Chemistry & Biology (GAT)',
        totalChapters: 14,
        doneChapters: 0,
        color: '#059669',
      },
      {
        id: 'sub_eng',
        name: isHindi ? 'English Grammar & Vocab (200)' : 'NDA English & Vocab (200)',
        totalChapters: 12,
        doneChapters: 0,
        color: '#d97706',
      },
      {
        id: 'sub_gat',
        name: isHindi ? 'सामान्य अध्ययन (History/Geo/CA)' : 'GAT (History / Geo / Polity / CA)',
        totalChapters: 18,
        doneChapters: 0,
        color: '#dc2626',
      },
    ];
  }

  const isJunior = effectiveClass === '9' || effectiveClass === '10';
  const withNda = trackIncludesNda(studyTrack);

  if (isJunior) {
    const base: Subject[] = [
      {
        id: 'sub_maths',
        name: isHindi
          ? `गणित (Class ${effectiveClass}${withNda ? ' + NDA Base' : ''})`
          : `Mathematics (Class ${effectiveClass}${withNda ? ' + NDA Base' : ''})`,
        totalChapters: 15,
        doneChapters: 0,
        color: '#0284c7',
      },
      {
        id: 'sub_sci',
        name: isHindi ? `विज्ञान (Science Class ${effectiveClass})` : `Science (Class ${effectiveClass})`,
        totalChapters: 15,
        doneChapters: 0,
        color: '#4f46e5',
      },
      {
        id: 'sub_sst',
        name: isHindi
          ? `सामाजिक विज्ञान${withNda ? ' + GK/GAT' : ''}`
          : `Social Science${withNda ? ' + NDA GK' : ''}`,
        totalChapters: 16,
        doneChapters: 0,
        color: '#dc2626',
      },
      {
        id: 'sub_hin',
        name: isHindi ? `हिंदी (UP Board Class ${effectiveClass})` : `Hindi (Class ${effectiveClass})`,
        totalChapters: 12,
        doneChapters: 0,
        color: '#0891b2',
      },
      {
        id: 'sub_eng',
        name: isHindi
          ? `अंग्रेज़ी Grammar${withNda ? ' & NDA Vocab' : ''}`
          : `English${withNda ? ' & NDA Vocab' : ''}`,
        totalChapters: 12,
        doneChapters: 0,
        color: '#d97706',
      },
    ];
    return base;
  }

  // Class 11 or 12
  const senior: Subject[] = [
    {
      id: 'sub_maths',
      name: isHindi
        ? `गणित (Class ${effectiveClass}${withNda ? ' + NDA' : ''})`
        : `Maths (Class ${effectiveClass}${withNda ? ' + NDA' : ''})`,
      totalChapters: 16,
      doneChapters: 0,
      color: '#0284c7',
    },
    {
      id: 'sub_phy',
      name: isHindi
        ? `भौतिक विज्ञान (Physics ${effectiveClass})`
        : `Physics (Class ${effectiveClass}${withNda ? ' + NDA' : ''})`,
      totalChapters: 15,
      doneChapters: 0,
      color: '#4f46e5',
    },
    {
      id: 'sub_chem',
      name: isHindi
        ? `रसायन विज्ञान (Chemistry ${effectiveClass})`
        : `Chemistry (Class ${effectiveClass})`,
      totalChapters: 14,
      doneChapters: 0,
      color: '#059669',
    },
    {
      id: 'sub_eng',
      name: isHindi
        ? `अंग्रेज़ी${withNda ? ' & NDA Vocab' : ` (Class ${effectiveClass})`}`
        : `English${withNda ? ' & NDA Vocab' : ` (Class ${effectiveClass})`}`,
      totalChapters: 12,
      doneChapters: 0,
      color: '#d97706',
    },
    {
      id: 'sub_hin',
      name: isHindi ? `हिंदी (UP Board Class ${effectiveClass})` : `Hindi / Elective (${effectiveClass})`,
      totalChapters: 12,
      doneChapters: 0,
      color: '#0891b2',
    },
  ];

  if (withNda) {
    senior.push({
      id: 'sub_gat',
      name: isHindi ? 'NDA GAT (GS: इतिहास/भूगोल/CA)' : 'NDA GAT (GS: History/Geo/Polity)',
      totalChapters: 15,
      doneChapters: 0,
      color: '#dc2626',
    });
  }

  return senior;
}
