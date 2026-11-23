import {
  BoardMedium,
  OnlineClassSlot,
  StudentClass,
  StudyLog,
  StudyNoteEntry,
  StudyTrack,
  SundayTestQuestion,
} from '../types';

interface CuratedQuestion {
  tags: string[];
  subject: string;
  questionHi: string;
  questionEn: string;
  optionsHi: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationHi: string;
  explanationEn: string;
}

const QUESTION_BANK: CuratedQuestion[] = [
  {
    tags: ['math', 'trig', 'nda', 'class_10', 'class_11', 'class_12', 'ganit'],
    subject: 'Mathematics',
    questionHi: 'यदि sin θ + cos θ = √2 cos(90° - θ), तो cot θ का मान क्या होगा?',
    questionEn: 'What is the value of sin²30° + cos²30° + tan 45°?',
    optionsHi: ['√2 - 1', '√2 + 1', '1 / √2', '2'],
    optionsEn: ['1', '2', '1.5', '0'],
    correctIndex: 1,
    explanationHi: 'cos(90° - θ) = sin θ => sin θ + cos θ = √2 sin θ => cos θ = (√2 - 1) sin θ => cot θ = √2 - 1; विकल्प क्रम अनुसार गणना करें (√2+1 अगर tan पूछा हो, या cotθ = √2+1? ध्यान: cosθ/sinθ = √2-1)। यहाँ 1+1 = 2 सरल मान check: सही उत्तर विकल्प 1 (√2-1) होना चाहिए — आइए स्पष्ट प्रश्न रखें।',
    explanationEn: 'sin²30° + cos²30° = 1 (identity) and tan 45° = 1, so 1 + 1 = 2.',
  },
  {
    tags: ['math', 'quad', 'algebra', 'class_9', 'class_10', 'class_11', 'nda'],
    subject: 'Mathematics',
    questionHi: 'द्विघात समीकरण x² - 5x + 6 = 0 के मूल (roots) क्या हैं?',
    questionEn: 'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
    optionsHi: ['2, 3', '-2, -3', '1, 6', '-1, 6'],
    optionsEn: ['2, 3', '-2, -3', '1, 6', '-1, 6'],
    correctIndex: 0,
    explanationHi: 'x² - 5x + 6 = (x - 2)(x - 3) = 0, अतः x = 2 और x = 3।',
    explanationEn: 'Factorizing gives (x - 2)(x - 3) = 0, so roots are 2 and 3.',
  },
  {
    tags: ['math', 'sets', 'class_11', 'nda'],
    subject: 'Mathematics',
    questionHi: 'यदि किसी समुच्चय (Set) A में 4 अवयव (elements) हैं, तो उसके घात समुच्चय P(A) में कितने अवयव होंगे?',
    questionEn: 'If a set A has 4 elements, how many subsets are in its Power Set P(A)?',
    optionsHi: ['8', '12', '16', '32'],
    optionsEn: ['8', '12', '16', '32'],
    correctIndex: 2,
    explanationHi: 'किसी समुच्चय में n अवयव होने पर कुल उपसमुच्चय 2ⁿ = 2⁴ = 16 होते हैं।',
    explanationEn: 'Number of subsets for n elements is 2ⁿ = 2⁴ = 16.',
  },
  {
    tags: ['phy', 'motion', 'newton', 'science', 'class_9', 'class_11', 'nda'],
    subject: 'Physics',
    questionHi: '5 kg द्रव्यमान की वस्तु पर कितना बल (Force) लगाया जाए कि उसमें 4 m/s² का त्वरण उत्पन्न हो?',
    questionEn: 'What force is required to produce an acceleration of 4 m/s² in a 5 kg body?',
    optionsHi: ['9 N', '20 N', '1.25 N', '40 N'],
    optionsEn: ['9 N', '20 N', '1.25 N', '40 N'],
    correctIndex: 1,
    explanationHi: 'न्यूटन के द्वितीय नियम से F = m × a = 5 × 4 = 20 Newton।',
    explanationEn: "By Newton's 2nd Law, F = m × a = 5 × 4 = 20 N.",
  },
  {
    tags: ['phy', 'electricity', 'ohm', 'class_10', 'class_12', 'nda', 'science'],
    subject: 'Physics',
    questionHi: 'विद्युत प्रतिरोध (Electrical Resistance) का SI मात्रक क्या होता है?',
    questionEn: 'What is the SI unit of Electrical Resistance?',
    optionsHi: ['वोल्ट (Volt)', 'एम्पीयर (Ampere)', 'ओम (Ohm)', 'वाट (Watt)'],
    optionsEn: ['Volt', 'Ampere', 'Ohm', 'Watt'],
    correctIndex: 2,
    explanationHi: 'ओम के नियम (R = V/I) से प्रतिरोध का SI मात्रक ओम (Ω) होता है।',
    explanationEn: 'By Ohm’s Law R = V/I, SI unit of resistance is Ohm (Ω).',
  },
  {
    tags: ['phy', 'light', 'optics', 'class_10', 'class_12', 'nda'],
    subject: 'Physics',
    questionHi: 'निर्वात (Vacuum) में प्रकाश की चाल कितनी होती है?',
    questionEn: 'What is the speed of light in vacuum?',
    optionsHi: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '1.5 × 10⁸ m/s'],
    optionsEn: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '1.5 × 10⁸ m/s'],
    correctIndex: 1,
    explanationHi: 'निर्वात में प्रकाश की चाल c = 3 × 10⁸ मीटर/सेकंड होती है।',
    explanationEn: 'Speed of light in vacuum is c ≈ 3 × 10⁸ m/s.',
  },
  {
    tags: ['chem', 'science', 'acid', 'ph', 'class_10', 'class_11', 'class_12', 'nda'],
    subject: 'Chemistry',
    questionHi: 'शुद्ध जल (Pure Water) का pH मान 25°C पर कितना होता है?',
    questionEn: 'What is the pH value of pure distilled water at 25°C?',
    optionsHi: ['0', '5', '7', '14'],
    optionsEn: ['0', '5', '7', '14'],
    correctIndex: 2,
    explanationHi: 'शुद्ध जल उदासीन (Neutral) होता है, अतः इसका pH = 7 होता है।',
    explanationEn: 'Pure water is neutral with [H⁺] = 10⁻⁷ M, giving pH = 7.',
  },
  {
    tags: ['chem', 'atom', 'mole', 'class_9', 'class_11', 'nda'],
    subject: 'Chemistry',
    questionHi: 'आवोगाद्रो संख्या (Avogadro Number) का मान कितना होता है?',
    questionEn: 'What is the value of Avogadro constant (Nₐ)?',
    optionsHi: ['6.022 × 10²³', '6.022 × 10⁻²³', '1.6 × 10⁻¹⁹', '9.8 × 10²'],
    optionsEn: ['6.022 × 10²³', '6.022 × 10⁻²³', '1.6 × 10⁻¹⁹', '9.8 × 10²'],
    correctIndex: 0,
    explanationHi: '1 मोल पदार्थ में 6.022 × 10²³ कण होते हैं।',
    explanationEn: '1 mole of any substance contains 6.022 × 10²³ entities.',
  },
  {
    tags: ['eng', 'grammar', 'vocab', 'nda', 'class_9', 'class_10', 'class_11', 'class_12'],
    subject: 'English',
    questionHi: 'Choose the correct synonym of "BRAVE":',
    questionEn: 'Choose the correct synonym of "AUDACIOUS":',
    optionsHi: ['Cowardly', 'Valiant', 'Timid', 'Lazy'],
    optionsEn: ['Timid', 'Daring', 'Silent', 'Weak'],
    correctIndex: 1,
    explanationHi: 'Valiant का अर्थ बहादुर / साहसी होता है।',
    explanationEn: 'Audacious means bold and daring.',
  },
  {
    tags: ['hin', 'hindi', 'vyakaran', 'class_9', 'class_10', 'class_11', 'class_12'],
    subject: 'Hindi',
    questionHi: '"विद्यालय" शब्द में कौन सी संधि है?',
    questionEn: 'In UP Board Hindi Vyakaran, which Samas is in "नीलकमल"?',
    optionsHi: ['गुण संधि', 'दीर्घ स्वर संधि', 'यण संधि', 'विसर्ग संधि'],
    optionsEn: ['Dwigu', 'Karmadharaya', 'Dwandwa', 'Avyayibhav'],
    correctIndex: 1,
    explanationHi: 'विद्या + आलय (आ + आ = आ) -> दीर्घ स्वर संधि।',
    explanationEn: 'Neela hai jo Kamal (Adjective + Noun) -> Karmadharaya Samas.',
  },
  {
    tags: ['gat', 'sst', 'polity', 'history', 'nda', 'class_9', 'class_10'],
    subject: 'GAT / Social Science',
    questionHi: 'भारतीय संविधान का कौन सा अनुच्छेद "संवैधानिक उपचारों का अधिकार" देता है?',
    questionEn: 'Which Article of the Indian Constitution provides the Right to Constitutional Remedies?',
    optionsHi: ['अनुच्छेद 14', 'अनुच्छेद 21', 'अनुच्छेद 32', 'अनुच्छेद 51A'],
    optionsEn: ['Article 14', 'Article 21', 'Article 32', 'Article 51A'],
    correctIndex: 2,
    explanationHi: 'अनुच्छेद 32 को डॉ. भीमराव अंबेडकर ने भारतीय संविधान की आत्मा कहा है।',
    explanationEn: 'Article 32 allows citizens to move the Supreme Court for Fundamental Rights.',
  },
  {
    tags: ['bio', 'science', 'class_9', 'class_10', 'nda'],
    subject: 'Biology / Science',
    questionHi: 'कोशिका का "ऊर्जा घर" (Powerhouse of the Cell) किसे कहा जाता है?',
    questionEn: 'Which cell organelle is known as the Powerhouse of the Cell?',
    optionsHi: ['राइबोसोम', 'माइटोकॉन्ड्रिया', 'लाइसोसोम', 'गॉल्जीकाय'],
    optionsEn: ['Ribosome', 'Mitochondria', 'Lysosome', 'Golgi Body'],
    correctIndex: 1,
    explanationHi: 'माइटोकॉन्ड्रिया कोशिका में ATP के रूप में ऊर्जा का निर्माण करता है।',
    explanationEn: 'Mitochondria generates ATP energy through cellular respiration.',
  },
];

export function buildOfflineSundayTest(params: {
  notes: StudyNoteEntry[];
  logs: StudyLog[];
  onlineClasses: OnlineClassSlot[];
  studentClass: StudentClass;
  studyTrack: StudyTrack;
  boardMedium: BoardMedium;
}): {testTitle: string; questions: SundayTestQuestion[]} {
  const isHindi = params.boardMedium === 'up_hindi';
  const contextText = [
    ...params.notes.map((n) => `${n.subject} ${n.title} ${n.textSummary}`),
    ...params.logs.slice(0, 15).map((l) => l.topic),
    ...params.onlineClasses.map((c) => c.title),
  ]
    .join(' ')
    .toLowerCase();

  // Prioritize questions matching student's notes/study topics + track/class
  const scored = QUESTION_BANK.map((q, idx) => {
    let score = 0;
    for (const tag of q.tags) {
      if (contextText.includes(tag)) score += 3;
      if (tag === `class_${params.studentClass}`) score += 2;
      if (params.studyTrack !== 'class_only' && tag === 'nda') score += 2;
    }
    return {q, score, idx};
  }).sort((a, b) => b.score - a.score || a.idx - b.idx);

  const selected = scored.slice(0, 10).map((item, idx): SundayTestQuestion => {
    // Fix the first Hindi question option consistency cleanly
    if (item.idx === 0 && isHindi) {
      return {
        id: `off_stq_${Date.now()}_${idx}`,
        subject: 'Mathematics',
        question: 'sin²30° + cos²30° + tan 45° का मान क्या होगा?',
        options: ['1', '2', '1.5', '0'],
        correctIndex: 1,
        explanation: 'sin²θ + cos²θ = 1 और tan 45° = 1, अतः 1 + 1 = 2।',
      };
    }

    return {
      id: `off_stq_${Date.now()}_${idx}`,
      subject: item.q.subject,
      question: isHindi ? item.q.questionHi : item.q.questionEn,
      options: isHindi ? item.q.optionsHi : item.q.optionsEn,
      correctIndex: item.q.correctIndex,
      explanation: isHindi ? item.q.explanationHi : item.q.explanationEn,
    };
  });

  // Also inject a personalized note-check question if user added study notes this week
  if (params.notes.length > 0) {
    const latestNote = params.notes[0];
    selected[selected.length - 1] = {
      id: `off_stq_note_${Date.now()}`,
      subject: latestNote.subject,
      question: isHindi
        ? `इस हफ्ते आपके "${latestNote.subject}" नोट्स (${latestNote.title}) किस मुख्य विषय से जुड़े थे?`
        : `Which weekly topic from your uploaded notes belongs to ${latestNote.subject}?`,
      options: [
        latestNote.title,
        isHindi ? 'कोई अन्य असंबद्ध अध्याय' : 'Unrelated Archive Chapter',
        isHindi ? 'पिछले सत्र का मॉक पेपर' : 'Previous Year Random Paper',
        isHindi ? 'उपरोक्त में से कोई नहीं' : 'None of the above',
      ],
      correctIndex: 0,
      explanation: latestNote.textSummary
        ? latestNote.textSummary
        : `Uploaded Note Topic: ${latestNote.title}`,
    };
  }

  return {
    testTitle: isHindi
      ? `रविवार साप्ताहिक रिवीजन टेस्ट (${params.notes.length} नोट्स + साप्ताहिक पढ़ाई)`
      : `Sunday Weekly Revision Test (${params.notes.length} Notes + Weekly Study)`,
    questions: selected,
  };
}
