import {BoardMedium} from '../types';

export interface OfflineSolveResult {
  subject: string;
  conceptUsed: string;
  steps: string[];
  finalAnswer: string;
  tip: string;
}

// Safe recursive-descent math expression evaluator (supports +, -, *, /, ^, %, sqrt, sin, cos, tan, log, pi)
function evaluateMathExpression(exprRaw: string): number | null {
  try {
    let expr = exprRaw
      .toLowerCase()
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/\bpi\b/g, `(${Math.PI})`)
      .replace(/(\d)(sin|cos|tan|sqrt|log)/g, '$1*$2')
      .replace(/(\d)\(/g, '$1*(')
      .replace(/\)\(/g, ')*(')
      .replace(/\s+/g, '');

    if (!expr || !/[0-9]/.test(expr)) return null;

    // Strip leading "solve" or trailing "="
    expr = expr.replace(/^solve/, '').replace(/=$/, '');

    let pos = 0;

    const peek = () => expr[pos] || '';
    const consume = () => expr[pos++] || '';

    const parseNumberOrFunc = (): number => {
      if (peek() === '+') {
        consume();
        return parseNumberOrFunc();
      }
      if (peek() === '-') {
        consume();
        return -parseNumberOrFunc();
      }
      if (peek() === '(') {
        consume();
        const val = parseAddSub();
        if (peek() === ')') consume();
        return val;
      }

      const fnMatch = /^(sqrt|sin|cos|tan|log10|log)\(/.exec(expr.slice(pos));
      if (fnMatch) {
        const fn = fnMatch[1];
        pos += fn.length + 1;
        const arg = parseAddSub();
        if (peek() === ')') consume();
        if (fn === 'sqrt') return Math.sqrt(arg);
        if (fn === 'sin') return Math.sin((arg * Math.PI) / 180);
        if (fn === 'cos') return Math.cos((arg * Math.PI) / 180);
        if (fn === 'tan') return Math.tan((arg * Math.PI) / 180);
        if (fn === 'log10' || fn === 'log') return Math.log10(arg);
      }

      const numMatch = /^(\d+(\.\d+)?)/.exec(expr.slice(pos));
      if (numMatch) {
        pos += numMatch[1].length;
        return parseFloat(numMatch[1]);
      }

      throw new Error('Invalid token');
    };

    const parsePower = (): number => {
      let base = parseNumberOrFunc();
      while (peek() === '^') {
        consume();
        const exp = parseNumberOrFunc();
        base = Math.pow(base, exp);
      }
      return base;
    };

    const parseMulDiv = (): number => {
      let left = parsePower();
      while (peek() === '*' || peek() === '/') {
        const op = consume();
        const right = parsePower();
        if (op === '*') left *= right;
        else {
          if (right === 0) throw new Error('Division by zero');
          left /= right;
        }
      }
      return left;
    };

    const parseAddSub = (): number => {
      let left = parseMulDiv();
      while (peek() === '+' || peek() === '-') {
        const op = consume();
        const right = parseMulDiv();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };

    const result = parseAddSub();
    if (pos !== expr.length || !Number.isFinite(result)) return null;
    return Number(result.toFixed(6));
  } catch {
    return null;
  }
}

function trySolveQuadratic(q: string, isHindi: boolean): OfflineSolveResult | null {
  // Match ax^2 + bx + c = 0 or similar
  const clean = q
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/²/g, '^2')
    .replace(/=0$/, '');
  const quadRegex = /^([+-]?\d*)x\^2([+-]\d*)x([+-]\d+)?$/;
  const m = quadRegex.exec(clean);
  if (!m) return null;

  const parseCoeff = (raw: string | undefined, defaultIfEmpty: number) => {
    if (!raw) return defaultIfEmpty;
    if (raw === '+') return 1;
    if (raw === '-') return -1;
    return parseFloat(raw);
  };

  const a = parseCoeff(m[1], 1);
  const b = parseCoeff(m[2], 1);
  const c = m[3] ? parseFloat(m[3]) : 0;
  if (a === 0) return null;

  const D = b * b - 4 * a * c;
  const steps: string[] = [
    isHindi
      ? `दिए गए द्विघात समीकरण ax² + bx + c = 0 से तुलना करने पर: a = ${a}, b = ${b}, c = ${c}`
      : `Comparing with ax² + bx + c = 0: a = ${a}, b = ${b}, c = ${c}`,
    isHindi
      ? `विविक्तकर (Discriminant) D = b² - 4ac = (${b})² - 4(${a})(${c}) = ${D}`
      : `Discriminant D = b² - 4ac = (${b})² - 4(${a})(${c}) = ${D}`,
  ];

  let finalAnswer = '';
  if (D > 0) {
    const r1 = Number(((-b + Math.sqrt(D)) / (2 * a)).toFixed(4));
    const r2 = Number(((-b - Math.sqrt(D)) / (2 * a)).toFixed(4));
    steps.push(`x = (-b ± √D) / 2a = (${-b} ± √${D}) / ${2 * a}`);
    finalAnswer = `x = ${r1} , ${r2}`;
  } else if (D === 0) {
    const r = Number((-b / (2 * a)).toFixed(4));
    steps.push(`D = 0, so equal real roots: x = -b / 2a = ${-b} / ${2 * a}`);
    finalAnswer = `x = ${r} (Equal Roots)`;
  } else {
    const real = Number((-b / (2 * a)).toFixed(3));
    const imag = Number((Math.sqrt(-D) / (2 * a)).toFixed(3));
    steps.push(`D < 0, imaginary roots: x = (${-b} ± i√${-D}) / ${2 * a}`);
    finalAnswer = `x = ${real} ± ${imag}i`;
  }

  return {
    subject: 'Mathematics (Algebra)',
    conceptUsed: 'Quadratic Formula: x = (-b ± √(b² - 4ac)) / 2a',
    steps,
    finalAnswer,
    tip: isHindi
      ? 'NDA व Class 10-12 दोनों में मूलों का योग (α+β = -b/a) और गुणनफल (αβ = c/a) भी याद रखें।'
      : 'Remember Sum of roots = -b/a and Product of roots = c/a for NDA & Board MCQs.',
  };
}

function trySolveLinear(q: string, isHindi: boolean): OfflineSolveResult | null {
  const clean = q.toLowerCase().replace(/\s+/g, '');
  const m = /^([+-]?\d*)x([+-]\d+)?=([+-]?\d+)$/.exec(clean);
  if (!m) return null;
  const aRaw = m[1];
  const a = !aRaw || aRaw === '+' ? 1 : aRaw === '-' ? -1 : parseFloat(aRaw);
  const b = m[2] ? parseFloat(m[2]) : 0;
  const c = parseFloat(m[3]);
  if (a === 0) return null;
  const x = Number(((c - b) / a).toFixed(4));

  return {
    subject: 'Mathematics (Linear Equation)',
    conceptUsed: 'ax + b = c => x = (c - b) / a',
    steps: [
      isHindi ? `समीकरण: ${a}x ${b >= 0 ? '+' : ''}${b} = ${c}` : `Given equation: ${a}x ${b >= 0 ? '+' : ''}${b} = ${c}`,
      `${a}x = ${c} - (${b}) = ${c - b}`,
      `x = ${c - b} / ${a} = ${x}`,
    ],
    finalAnswer: `x = ${x}`,
    tip: isHindi
      ? 'उत्तर को मूल समीकरण में रखकर तुरंत सत्यापित (verify) करें।'
      : 'Verify x by substituting back into the LHS.',
  };
}

function extractVar(text: string, name: string): number | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)`, 'i');
  const m = re.exec(text);
  return m ? parseFloat(m[1]) : null;
}

function trySolvePhysicsOrChem(q: string, isHindi: boolean): OfflineSolveResult | null {
  const lower = q.toLowerCase();

  // Ohm's Law: V, I, R
  const v = extractVar(q, 'v');
  const i = extractVar(q, 'i');
  const r = extractVar(q, 'r');
  if (lower.includes('ohm') || (v !== null && i !== null) || (i !== null && r !== null) || (v !== null && r !== null)) {
    if (v !== null && i !== null && i !== 0) {
      const res = Number((v / i).toFixed(3));
      return {
        subject: 'Physics (Electricity)',
        conceptUsed: "Ohm's Law: V = I × R",
        steps: [`Given V = ${v} Volt, I = ${i} Ampere`, `R = V / I = ${v} / ${i}`],
        finalAnswer: `R = ${res} Ω (Ohms)`,
        tip: 'Power formula P = V×I = I²R = V²/R bhi important hai.',
      };
    }
    if (i !== null && r !== null) {
      const volt = Number((i * r).toFixed(3));
      return {
        subject: 'Physics (Electricity)',
        conceptUsed: "Ohm's Law: V = I × R",
        steps: [`Given I = ${i} A, R = ${r} Ω`, `V = I × R = ${i} × ${r}`],
        finalAnswer: `V = ${volt} Volts`,
        tip: 'SI Unit: Voltage = Volt (V), Current = Ampere (A), Resistance = Ohm (Ω).',
      };
    }
    if (v !== null && r !== null && r !== 0) {
      const cur = Number((v / r).toFixed(3));
      return {
        subject: 'Physics (Electricity)',
        conceptUsed: "Ohm's Law: I = V / R",
        steps: [`Given V = ${v} V, R = ${r} Ω`, `I = V / R = ${v} / ${r}`],
        finalAnswer: `I = ${cur} Amperes`,
        tip: 'Series me current same rehta hai aur parallel me voltage same.',
      };
    }
  }

  // Force F = m * a
  const mVal = extractVar(q, 'm');
  const aVal = extractVar(q, 'a');
  if (mVal !== null && aVal !== null) {
    const force = Number((mVal * aVal).toFixed(3));
    return {
      subject: 'Physics (Laws of Motion)',
      conceptUsed: "Newton's 2nd Law: F = m × a",
      steps: [`Mass (m) = ${mVal} kg, Acceleration (a) = ${aVal} m/s²`, `Force F = m × a = ${mVal} × ${aVal}`],
      finalAnswer: `F = ${force} N (Newtons)`,
      tip: '1 Newton = 10⁵ Dyne (CGS unit).',
    };
  }

  // Kinetic Energy KE = 0.5 * m * v^2
  if (mVal !== null && v !== null && (lower.includes('kinetic') || lower.includes('ke') || lower.includes('गतिज'))) {
    const ke = Number((0.5 * mVal * v * v).toFixed(3));
    return {
      subject: 'Physics (Work, Energy & Power)',
      conceptUsed: 'Kinetic Energy KE = ½ m v²',
      steps: [`m = ${mVal} kg, v = ${v} m/s`, `KE = 0.5 × ${mVal} × (${v})²`],
      finalAnswer: `KE = ${ke} Joules`,
      tip: 'Momentum p = mv, aur relation KE = p² / (2m) NDA numericals me bahut aata hai!',
    };
  }

  // Kinematics v = u + a*t, s = u*t + 0.5*a*t^2
  const uVal = extractVar(q, 'u');
  const tVal = extractVar(q, 't');
  if (uVal !== null && aVal !== null && tVal !== null) {
    const vel = Number((uVal + aVal * tVal).toFixed(3));
    const dist = Number((uVal * tVal + 0.5 * aVal * tVal * tVal).toFixed(3));
    return {
      subject: 'Physics (Kinematics)',
      conceptUsed: 'Equations of Motion: v = u + at, s = ut + ½at²',
      steps: [
        `u = ${uVal} m/s, a = ${aVal} m/s², t = ${tVal} s`,
        `v = ${uVal} + (${aVal} × ${tVal}) = ${vel} m/s`,
        `s = (${uVal} × ${tVal}) + 0.5 × ${aVal} × (${tVal})² = ${dist} m`,
      ],
      finalAnswer: `v = ${vel} m/s , Distance s = ${dist} m`,
      tip: '3rd equation v² = u² + 2as tab lagayein jab time (t) na diya ho.',
    };
  }

  // Chemistry pH
  if (lower.includes('ph') && /10\^-?\d+/.test(lower)) {
    const phMatch = /10\^(-?\d+)/.exec(lower);
    if (phMatch) {
      const exp = Math.abs(parseInt(phMatch[1], 10));
      return {
        subject: 'Chemistry (Acids, Bases & Salts)',
        conceptUsed: 'pH = -log₁₀[H⁺]',
        steps: [`[H⁺] = 10^-${exp} M`, `pH = -log₁₀(10^-${exp}) = ${exp}`],
        finalAnswer: `pH = ${exp} (${exp < 7 ? 'Acidic / अम्लीय' : exp === 7 ? 'Neutral / उदासीन' : 'Basic / क्षारीय'})`,
        tip: isHindi
          ? 'pH < 7 अम्ल, pH = 7 उदासीन (जल), और pH > 7 क्षार होता है।'
          : 'pH < 7 is acidic, 7 is neutral, and > 7 is basic.',
      };
    }
  }

  return null;
}

interface KnowledgeTopic {
  keywords: string[];
  subject: string;
  concept: string;
  stepsHi: string[];
  stepsEn: string[];
  answerHi: string;
  answerEn: string;
  tip: string;
}

const OFFLINE_KNOWLEDGE_BANK: KnowledgeTopic[] = [
  {
    keywords: ['pythagoras', 'पाइथागोरस', 'hypotenuse', 'कर्ण', 'triangle', 'समकोण'],
    subject: 'Mathematics (Geometry / Trig)',
    concept: 'Pythagoras Theorem: H² = P² + B²',
    stepsHi: [
      'किसी समकोण त्रिभुज (Right-angled triangle) में सबसे बड़ी भुजा कर्ण (Hypotenuse) होती है।',
      'सूत्र: (कर्ण)² = (लंब)² + (आधार)² => H = √(P² + B²)',
      'मुख्य Triplets याद रखें: (3,4,5), (5,12,13), (8,15,17), (7,24,25)।',
    ],
    stepsEn: [
      'In a right-angled triangle, the side opposite the 90° angle is the Hypotenuse (H).',
      'Formula: H² = P² + B² => H = √(P² + B²).',
      'Key Pythagorean triplets: (3,4,5), (5,12,13), (8,15,17), (7,24,25).',
    ],
    answerHi: 'H² = P² + B² (कर्ण² = लंब² + आधार²)',
    answerEn: 'H² = P² + B²',
    tip: 'Trigonometry & NDA height-distance questions solve karne ke liye triplets directly yaad rakhein.',
  },
  {
    keywords: ['trigonometry', 'sin', 'cos', 'tan', 'त्रिकोणमिति', 'identity', 'सर्वसमिका'],
    subject: 'Mathematics (Trigonometry)',
    concept: 'Fundamental Trigonometric Identities',
    stepsHi: [
      '1) sin²θ + cos²θ = 1',
      '2) 1 + tan²θ = sec²θ  (sec²θ - tan²θ = 1)',
      '3) 1 + cot²θ = cosec²θ  (cosec²θ - cot²θ = 1)',
      '4) sin(A+B) = sinA cosB + cosA sinB, cos2θ = cos²θ - sin²θ',
    ],
    stepsEn: [
      '1) sin²θ + cos²θ = 1',
      '2) 1 + tan²θ = sec²θ  => sec²θ - tan²θ = 1',
      '3) 1 + cot²θ = cosec²θ',
      '4) sin(2θ) = 2sinθcosθ, cos(2θ) = cos²θ - sin²θ = 1 - 2sin²θ',
    ],
    answerHi: 'sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ',
    answerEn: 'sin²θ + cos²θ = 1 | 1 + tan²θ = sec²θ | 1 + cot²θ = cosec²θ',
    tip: 'NDA Maths me har saal Trigonometry se 10-14 questions aate hain!',
  },
  {
    keywords: ['newton', 'न्यूटन', 'motion', 'गति', 'law', 'inertia', 'जड़त्व'],
    subject: 'Physics (Mechanics)',
    concept: "Newton's Three Laws of Motion",
    stepsHi: [
      'पहला नियम (जड़त्व का नियम): कोई वस्तु तब तक स्थिर या एकसमान गति में रहती है जब तक बाह्य बल न लगे।',
      'दूसरा नियम: संवेग परिवर्तन की दर लगाए गए बल के समानुपाती होती है (F = ma)।',
      'तीसरा नियम: प्रत्येक क्रिया के बराबर और विपरीत प्रतिक्रिया होती है (Action = -Reaction)।',
    ],
    stepsEn: [
      '1st Law (Inertia): A body continues in rest or uniform motion unless acted upon by an external force.',
      '2nd Law: Rate of change of momentum is directly proportional to applied force (F = dp/dt = ma).',
      '3rd Law: Every action has an equal and opposite reaction acting on two different bodies.',
    ],
    answerHi: '1st: जड़त्व | 2nd: F = ma | 3rd: क्रिया-प्रतिक्रिया',
    answerEn: '1st: Inertia | 2nd: F = ma | 3rd: Action-Reaction',
    tip: 'Action aur Reaction hamesha alag-alag objects par lagte hain, ek par nahi!',
  },
  {
    keywords: ['derivative', 'differentiation', 'अवकलन', 'integration', 'समाकलन', 'calculus'],
    subject: 'Mathematics (Calculus)',
    concept: 'Standard Differentiation & Integration Rules',
    stepsHi: [
      'd/dx (xⁿ) = n·xⁿ⁻¹ | d/dx (sin x) = cos x | d/dx (cos x) = -sin x',
      'd/dx (eˣ) = eˣ | d/dx (ln x) = 1/x',
      '∫ xⁿ dx = xⁿ⁺¹ / (n+1) + C (n ≠ -1) | ∫ (1/x) dx = ln|x| + C',
    ],
    stepsEn: [
      'd/dx (xⁿ) = n·xⁿ⁻¹ | d/dx (sin x) = cos x | d/dx (cos x) = -sin x',
      'd/dx (eˣ) = eˣ | d/dx (ln x) = 1/x | Product rule: (uv)′ = u′v + uv′',
      '∫ xⁿ dx = xⁿ⁺¹ / (n+1) + C (n ≠ -1) | ∫ (1/x) dx = ln|x| + C',
    ],
    answerHi: 'd/dx(xⁿ) = n·xⁿ⁻¹ तथा ∫xⁿdx = xⁿ⁺¹/(n+1) + C',
    answerEn: 'd/dx(xⁿ) = n·xⁿ⁻¹ & ∫xⁿdx = xⁿ⁺¹/(n+1) + C',
    tip: 'Chain rule lagate waqt outer function ke baad inner function ka derivative multiply karna na bhulein.',
  },
  {
    keywords: ['sandhi', 'संधि', 'samas', 'समास', 'alankar', 'अलंकार', 'ras', 'रस', 'hindi', 'व्याकरण'],
    subject: 'Hindi Vyakaran (UP Board)',
    concept: 'संधि, समास एवं अलंकार मुख्य नियम',
    stepsHi: [
      'संधि 3 प्रकार की होती है: स्वर संधि (दीर्घ, गुण, वृद्धि, यण, अयादि), व्यंजन संधि, विसर्ग संधि।',
      'समास 6 प्रकार के हैं: अव्ययीभाव, तत्पुरुष, कर्मधारय, द्विगु (संख्या), द्वंद्व (और), बहुव्रीहि (तीसरा अर्थ)।',
      'अलंकार: अनुप्रास (वर्ण की आवृत्ति), यमक (शब्द दो बार अलग अर्थ), श्लेष (एक शब्द के अनेक अर्थ), उपमा (सा/सी तुलना)।',
    ],
    stepsEn: [
      'Sandhi Types: Swar (Dirgha, Guna, Vriddhi, Yan, Ayadi), Vyanjan, Visarga.',
      'Samas Types (6): Avyayibhav, Tatpurush, Karmadharaya, Dwigu (number), Dwandwa, Bahuvrihi.',
      'Alankar: Anupras (letter repeat), Yamak (same word diff meaning), Shlesh, Upama.',
    ],
    answerHi: 'स्वर/व्यंजन/विसर्ग संधि | 6 प्रमुख समास | शब्दालंकार व अर्थालंकार',
    answerEn: 'UP Board Hindi Vyakaran Core Rules Summary',
    tip: 'Board exam mein उदाहरण (example) jaroor likhein, pure marks milte hain!',
  },
  {
    keywords: ['tense', 'passive', 'voice', 'grammar', 'narration', 'direct', 'indirect', 'english'],
    subject: 'English Grammar (Board + NDA)',
    concept: 'Active-Passive Voice & Tense Conversion Rules',
    stepsHi: [
      'Active से Passive में Object को Subject बनाते हैं और हमेशा Verb की 3rd Form (V3) का प्रयोग करते हैं।',
      'Simple Present (V1/Vs) -> is/am/are + V3 | Simple Past (V2) -> was/were + V3',
      'Continuous (-ing) -> being + V3 | Perfect (has/have/had) -> been + V3',
    ],
    stepsEn: [
      '1. Swap Subject & Object; always use Past Participle (V3) after helping verb.',
      '2. Simple Present -> is/am/are + V3 | Simple Past -> was/were + V3',
      '3. Continuous -> + being + V3 | Perfect -> + been + V3 | Modals -> modal + be + V3',
    ],
    answerHi: 'Always use Helping Verb + V3 + by + Agent in Passive Voice',
    answerEn: 'Be/Been/Being + V3 (Past Participle) is mandatory in Passive Voice.',
    tip: 'NDA Error Spotting me Subject-Verb Agreement aur Prepositions sabse zyada puchhe jate hain.',
  },
  {
    keywords: ['photosynthesis', 'प्रकाश संश्लेषण', 'cell', 'कोशिका', 'mitochondria', 'dna', 'biology', 'जीव विज्ञान'],
    subject: 'Biology / Science',
    concept: 'Cell Biology & Photosynthesis Equation',
    stepsHi: [
      'प्रकाश संश्लेषण (Photosynthesis): 6CO₂ + 12H₂O --(सूर्य का प्रकाश / क्लोरोफिल)--> C₆H₁₂O₆ + 6O₂ + 6H₂O',
      'माइटोकॉन्ड्रिया (Mitochondria) को कोशिका का "ऊर्जा घर" (Powerhouse of Cell — ATP) कहते हैं।',
      'राइबोसोम (Ribosome) प्रोटीन संश्लेषण (Protein Factory) करता है।',
    ],
    stepsEn: [
      'Photosynthesis: 6CO₂ + 12H₂O --(Sunlight / Chlorophyll)--> C₆H₁₂O₆ + 6O₂ + 6H₂O',
      'Mitochondria is the Powerhouse of the cell (produces ATP energy).',
      'Ribosomes synthesize proteins; Lysosomes are Suicidal Bags.',
    ],
    answerHi: '6CO₂ + 12H₂O -> C₆H₁₂O₆ (Glucose) + 6O₂ + 6H₂O | Mitochondria = ATP Powerhouse',
    answerEn: '6CO₂ + 12H₂O -> C₆H₁₂O₆ + 6O₂ + 6H₂O',
    tip: 'UP Board & NDA GAT Science me Vitamin deficiency diseases & cell organelles aksar aate hain.',
  },
  {
    keywords: ['constitution', 'संविधान', 'article', 'अनुच्छेद', 'fundamental', 'मौलिक अधिकार', 'polity', 'nda', 'history'],
    subject: 'Social Science / NDA GAT',
    concept: 'Indian Constitution & Fundamental Rights',
    stepsHi: [
      'भारतीय संविधान में भाग 3 (अनुच्छेद 12 से 35) में 6 मौलिक अधिकार दिए गए हैं।',
      'अनुच्छेद 14-18: समानता का अधिकार | अनुच्छेद 19-22: स्वतंत्रता का अधिकार | अनुच्छेद 32: संवैधानिक उपचार (Dr. Ambedkar ने संविधान की आत्मा कहा)।',
      'संविधान 26 नवंबर 1949 को अंगीकृत और 26 जनवरी 1950 को लागू हुआ।',
    ],
    stepsEn: [
      'Part III (Articles 12–35) guarantees 6 Fundamental Rights.',
      'Art 14–18: Right to Equality | Art 19–22: Right to Freedom | Art 32: Constitutional Remedies.',
      'Adopted: 26 Nov 1949 · Enforced: 26 Jan 1950.',
    ],
    answerHi: 'भाग 3 (अनुच्छेद 12–35) — 6 मौलिक अधिकार',
    answerEn: 'Part III (Articles 12–35) — 6 Fundamental Rights',
    tip: 'NDA GAT me Fundamental Duties (Art 51A, 42nd Amendment) aur Preamble keywords bhi zaroor padhein.',
  },
];

export function solveQuestionOffline(
  questionRaw: string,
  subjectHint: string,
  medium: BoardMedium,
  hasImage: boolean,
): OfflineSolveResult {
  const isHindi = medium === 'up_hindi';
  const q = questionRaw.trim();

  if (!q) {
    return {
      subject: subjectHint || 'Smart Buddy Offline',
      conceptUsed: isHindi ? 'ऑफलाइन (बिन इंटरनेट) सॉल्वर गाइड' : 'Offline Instant Solver Guide',
      steps: [
        hasImage
          ? isHindi
            ? 'आपकी फोटो सेव हो गई है! बिना डेटा/इंटरनेट के सटीक हल पाने के लिए प्रश्न का समीकरण या मुख्य शब्द ऊपर बॉक्स में लिखें (जैसे: 2x^2-5x+3=0 या V=12, I=3 या Pythagoras)।'
            : 'Your photo is attached! When offline (without mobile data), type the key equation or words from the photo above (e.g. 2x^2-5x+3=0, V=12 I=3, or topic name) to get exact offline steps.'
          : isHindi
            ? 'कृपया प्रश्न लिखें या फोटो अपलोड करें।'
            : 'Please type a question or upload a photo.',
      ],
      finalAnswer: isHindi ? 'ऑफलाइन सॉल्वर तैयार है' : 'Offline Solver Ready',
      tip: isHindi
        ? 'उदाहरण: "(45*2)+sqrt(144)", "x^2-5x+6=0", "m=5, a=4", "sin(30)+cos(60)" या किसी अध्याय का नाम लिखें!'
        : 'Try: "(45*2)+sqrt(144)", "x^2-5x+6=0", "m=5, a=4", "sin(30)+cos(60)", or any subject topic!',
    };
  }

  // 1. Check percentage queries like "15% of 480"
  const pctMatch = /(\d+(?:\.\d+)?)\s*%\s*(?:of|का)\s*(\d+(?:\.\d+)?)/i.exec(q);
  if (pctMatch) {
    const p = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const ans = Number(((p / 100) * total).toFixed(4));
    return {
      subject: 'Mathematics (Percentage)',
      conceptUsed: 'Percentage = (Rate / 100) × Total',
      steps: [
        `${p}% of ${total} = (${p} / 100) × ${total}`,
        `= ${(p / 100).toFixed(4)} × ${total} = ${ans}`,
      ],
      finalAnswer: String(ans),
      tip: 'Fast trick: 10% nikalne ke liye ek decimal left shift karein.',
    };
  }

  // 2. Quadratic equation
  const quad = trySolveQuadratic(q, isHindi);
  if (quad) return quad;

  // 3. Linear equation
  const lin = trySolveLinear(q, isHindi);
  if (lin) return lin;

  // 4. Direct numeric/trigonometric expression evaluation
  const mathVal = evaluateMathExpression(q);
  if (mathVal !== null) {
    return {
      subject: subjectHint && subjectHint !== 'Auto' ? subjectHint : 'Mathematics',
      conceptUsed: 'BODMAS / Algebraic & Trigonometric Evaluation',
      steps: [
        isHindi ? `दिया गया व्यंजक: ${q}` : `Expression: ${q}`,
        isHindi
          ? 'BODMAS नियम (Brackets → Orders/Powers → Division → Multiplication → Addition → Subtraction) लागू करने पर:'
          : 'Applying BODMAS (Brackets → Powers → Div/Mul → Add/Sub) with angles in degrees:',
        `= ${mathVal}`,
      ],
      finalAnswer: String(mathVal),
      tip: 'sin/cos/tan functions yahan degree mode me calculate hote hain (jaise sin(30) = 0.5).',
    };
  }

  // 5. Physics & Chemistry numericals
  const phyChem = trySolvePhysicsOrChem(q, isHindi);
  if (phyChem) return phyChem;

  // 6. All-Subject Knowledge Bank match
  const lower = q.toLowerCase();
  const matchedTopic = OFFLINE_KNOWLEDGE_BANK.find((item) =>
    item.keywords.some((kw) => lower.includes(kw)),
  );
  if (matchedTopic) {
    return {
      subject: matchedTopic.subject,
      conceptUsed: matchedTopic.concept,
      steps: isHindi ? matchedTopic.stepsHi : matchedTopic.stepsEn,
      finalAnswer: isHindi ? matchedTopic.answerHi : matchedTopic.answerEn,
      tip: matchedTopic.tip,
    };
  }

  // 7. Graceful multi-subject structured guide when question needs custom reasoning offline
  return {
    subject: subjectHint && subjectHint !== 'Auto' ? subjectHint : 'All Subjects Guide',
    conceptUsed: isHindi
      ? 'ऑफलाइन कॉन्सेप्ट ब्रेकडाउन (बिना इंटरनेट)'
      : 'Offline Structured Study Breakdown',
    steps: isHindi
      ? [
          `प्रश्न चिन्हित: "${q.slice(0, 120)}${q.length > 120 ? '...' : ''}"`,
          'Step 1 (दिया गया डेटा / Given): प्रश्न में दिए गए मुख्य मान (values), सूत्र या मुख्य नियम अलग लिखें।',
          'Step 2 (सूत्र / Concept): संबंधित अध्याय का मूल सूत्र (जैसे Maths: द्विघात/त्रिकोणमिति, Physics: F=ma / V=IR, Chemistry: मोल/समीकरण, Hindi/English: व्याकरण नियम) चुनें।',
          'Step 3: मानों को SI मात्रक में बदलकर गणना करें। यदि इंटरनेट चालू हो तो "Online Gemini Vision" से फोटो सहित पूरा हल तुरंत प्राप्त करें।',
        ]
      : [
          `Question recorded: "${q.slice(0, 120)}${q.length > 120 ? '...' : ''}"`,
          'Step 1 (Identify Given Data): List known quantities, keywords, or grammatical/scientific rules.',
          'Step 2 (Select Formula / Rule): Match with chapter formula (Maths equations, Physics laws, Chemistry mole/pH, or English/Hindi grammar).',
          'Step 3: For complex handwritten/diagram word problems from photos, tap Solve again whenever mobile data is ON for full Vision breakdown.',
        ],
    finalAnswer: isHindi
      ? 'ऑफलाइन नोटबुक में सेव किया गया · सटीक गणित/भौतिकी मान (जैसे m=5, a=3 या x^2-5x+6=0) लिखकर तुरंत हल पाएं'
      : 'Saved to Offline Notebook · Enter exact equation/values (e.g. x^2-5x+6=0, m=5, a=3) for instant calculation',
    tip: isHindi
      ? 'Smart Buddy बिना डेटा के गणित के समीकरण, प्रतिशत, त्रिकोणमिति, न्यूटन के नियम, ओम का नियम और मुख्य व्याकरण तुरंत हल कर देता है!'
      : 'Smart Buddy solves equations, trig, physics/chemistry numericals, and core concepts 100% offline!',
  };
}
