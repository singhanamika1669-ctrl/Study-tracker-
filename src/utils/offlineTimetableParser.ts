import {BoardMedium, StudentClass, StudyTrack, Subject} from '../types';

export interface ParsedTimetableCandidate {
  day: string;
  start: string;
  end: string;
  subjectId: string;
  subjectHint: string;
  task: string;
}

function normalizeTime24(raw: string): string {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(raw.trim());
  if (!m) return '08:00';
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2] || '0', 10);
  const ampm = (m[3] || '').toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  h = Math.max(0, Math.min(23, h));
  const safeMin = Math.max(0, Math.min(59, min));
  return `${String(h).padStart(2, '0')}:${String(safeMin).padStart(2, '0')}`;
}

export function matchSubjectId(hint: string, subjects: Subject[]): string {
  const lower = hint.toLowerCase();
  const byExact = subjects.find((s) => s.name.toLowerCase().includes(lower));
  if (byExact) return byExact.id;

  const keywords: Array<[string[], string[]]> = [
    [['math', 'ganit', 'गणित', 'trig', 'algebra', 'calc'], ['math', 'गणित']],
    [['phy', 'bhautik', 'भौतिक', 'optics', 'motion'], ['phy', 'भौतिक', 'sci', 'विज्ञान']],
    [['chem', 'rasayan', 'रसायन', 'organic'], ['chem', 'रसायन', 'sci', 'विज्ञान']],
    [['sci', 'vigyan', 'विज्ञान', 'bio', 'जीव'], ['sci', 'विज्ञान', 'phy', 'chem']],
    [['eng', 'vocab', 'अंग्रेज', 'grammar'], ['eng', 'अंग्रेज']],
    [['hin', 'हिंद', 'vyakaran', 'हिंदी'], ['hin', 'हिंद']],
    [['gat', 'gk', 'gs', 'history', 'geo', 'polity', 'sst', 'सामाजिक'], ['gat', 'sst', 'सामाजिक', 'सामान्य']],
  ];

  for (const [qKeys, sKeys] of keywords) {
    if (qKeys.some((k) => lower.includes(k))) {
      const found = subjects.find((s) =>
        sKeys.some((sk) => s.name.toLowerCase().includes(sk)),
      );
      if (found) return found.id;
    }
  }
  return subjects[0]?.id || '';
}

export function parseTimetableTextOffline(
  rawText: string,
  subjects: Subject[],
): ParsedTimetableCandidate[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedTimetableCandidate[] = [];
  const rangeRegex =
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–|—|से)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;

  for (const line of lines) {
    const match = rangeRegex.exec(line);
    if (!match) continue;
    const start = normalizeTime24(match[1]);
    const end = normalizeTime24(match[2]);
    const remainder = line.replace(match[0], '').replace(/^[:\-–\s]+/, '').trim();
    const dayMatch = /\b(Daily|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.exec(remainder);
    const day = dayMatch
      ? dayMatch[1][0].toUpperCase() + dayMatch[1].slice(1).toLowerCase()
      : 'Daily';
    const cleanTask = remainder.replace(/\b(Daily|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, '').trim() || 'Study Session';
    const subjectId = matchSubjectId(cleanTask, subjects);
    const matchedSub = subjects.find((s) => s.id === subjectId);
    results.push({
      day,
      start,
      end,
      subjectId,
      subjectHint: matchedSub?.name || 'Study',
      task: cleanTask,
    });
  }

  return results;
}

export function buildTemplateSlotsForTrack(
  studentClass: StudentClass,
  studyTrack: StudyTrack,
  boardMedium: BoardMedium,
  subjects: Subject[],
): ParsedTimetableCandidate[] {
  const isHindi = boardMedium === 'up_hindi';
  const pick = (hint: string) => matchSubjectId(hint, subjects);

  if (studyTrack === 'class_only') {
    return [
      {
        day: 'Daily',
        start: '06:00',
        end: '07:30',
        subjectId: pick('maths'),
        subjectHint: 'Maths',
        task: isHindi ? `कक्षा ${studentClass} गणित अभ्यास` : `Class ${studentClass} Maths Practice`,
      },
      {
        day: 'Daily',
        start: '16:00',
        end: '17:30',
        subjectId: pick('science physics'),
        subjectHint: 'Science/Physics',
        task: isHindi ? 'विज्ञान / भौतिकी नोट्स व प्रश्न' : 'Science / Physics Concepts',
      },
      {
        day: 'Daily',
        start: '18:30',
        end: '19:30',
        subjectId: pick('english'),
        subjectHint: 'English',
        task: isHindi ? 'English Grammar & Writing' : 'English Reading & Grammar',
      },
      {
        day: 'Daily',
        start: '20:00',
        end: '21:00',
        subjectId: pick('hindi'),
        subjectHint: 'Hindi/SST',
        task: isHindi ? 'हिंदी / सामाजिक विज्ञान रिवीजन' : 'Hindi / Social Science Revision',
      },
    ];
  }

  if (studyTrack === 'nda_only') {
    return [
      {
        day: 'Daily',
        start: '05:30',
        end: '06:30',
        subjectId: pick('english'),
        subjectHint: 'PT & Vocab',
        task: 'Morning Running + PT + 15 NDA Vocab',
      },
      {
        day: 'Daily',
        start: '09:00',
        end: '11:30',
        subjectId: pick('maths'),
        subjectHint: 'NDA Maths',
        task: 'NDA Mathematics Paper-I PYQs & Speed Drills',
      },
      {
        day: 'Daily',
        start: '15:00',
        end: '17:00',
        subjectId: pick('physics'),
        subjectHint: 'Physics/Chem',
        task: 'NDA GAT Science (Physics + Chemistry)',
      },
      {
        day: 'Daily',
        start: '19:30',
        end: '21:00',
        subjectId: pick('gat'),
        subjectHint: 'GAT GS',
        task: 'NDA History / Geography / Current Affairs',
      },
    ];
  }

  // Class + NDA integrated template
  return [
    {
      day: 'Daily',
      start: '05:30',
      end: '06:30',
      subjectId: pick('english'),
      subjectHint: 'PT & Vocab',
      task: 'Morning PT + NDA Vocab & Grammar',
    },
    {
      day: 'Daily',
      start: '12:30',
      end: '14:30',
      subjectId: pick('maths'),
      subjectHint: 'Maths',
      task: `Class ${studentClass} Maths + NDA PYQs`,
    },
    {
      day: 'Daily',
      start: '17:30',
      end: '19:00',
      subjectId: pick('physics'),
      subjectHint: 'Physics/Sci',
      task: `Class ${studentClass} Science / Physics Numericals`,
    },
    {
      day: 'Daily',
      start: '20:30',
      end: '21:30',
      subjectId: pick('gat'),
      subjectHint: 'GAT/Board',
      task: isHindi ? 'UP Board हिंदी/GS + NDA GAT' : 'Board Revision + NDA GAT GS',
    },
  ];
}
