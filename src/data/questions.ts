import { Question } from '../types';

// Questions are assigned to dates by rotating through the list.
// id format: q_NNN (padded 3 digits)

export const QUESTIONS: Question[] = [
  // ── Personal identity ──────────────────────────────────────────────
  {
    id: 'q_001',
    text: 'What is your gender?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_002',
    text: 'What is your date of birth?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_003',
    text: 'What country do you currently live in?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_004',
    text: 'Do you live in a city, a suburb, or the countryside?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_005',
    text: 'What is your native language?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_006',
    text: 'Are you more of an introvert or an extrovert?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_007',
    text: 'What is your relationship status?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_008',
    text: 'Do you have any siblings? How many?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_009',
    text: 'What do you do for work — or what are you studying?',
    date: '',
    category: 'Identity',
  },
  {
    id: 'q_010',
    text: 'Do you consider yourself a morning person or a night owl?',
    date: '',
    category: 'Identity',
  },

  // ── Favorites ──────────────────────────────────────────────────────
  {
    id: 'q_011',
    text: 'What is your favorite color?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_012',
    text: 'What is your all-time favorite movie?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_013',
    text: 'What is your favorite music genre?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_014',
    text: 'Who is your favorite musical artist or band?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_015',
    text: 'What is your favorite food?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_016',
    text: 'What is your favorite season of the year?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_017',
    text: 'What is your favorite book or the last book that really moved you?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_018',
    text: 'What is your favorite TV show or series?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_019',
    text: 'What is your favorite sport to watch or play?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_020',
    text: 'What is your favorite way to spend a Sunday?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_021',
    text: 'What is your favorite drink — alcoholic or not?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_022',
    text: 'What is your favorite type of cuisine (Italian, Japanese, Mexican…)?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_023',
    text: 'What is your favorite animal?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_024',
    text: 'What is your favorite holiday of the year?',
    date: '',
    category: 'Favorites',
  },
  {
    id: 'q_025',
    text: 'What is your favorite childhood memory?',
    date: '',
    category: 'Favorites',
  },

  // ── Lifestyle ──────────────────────────────────────────────────────
  {
    id: 'q_026',
    text: 'How many hours of sleep do you usually get per night?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_027',
    text: 'How often do you exercise in a typical week?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_028',
    text: 'Do you cook at home regularly, or do you mostly eat out?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_029',
    text: 'Do you have any pets?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_030',
    text: 'How do you usually commute — car, transit, bike, or on foot?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_031',
    text: 'How many hours a day do you spend on your phone?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_032',
    text: 'Do you prefer coffee or tea?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_033',
    text: 'How often do you travel in a year?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_034',
    text: 'Are you a spender or a saver when it comes to money?',
    date: '',
    category: 'Lifestyle',
  },
  {
    id: 'q_035',
    text: 'Do you prefer staying in or going out on a Friday night?',
    date: '',
    category: 'Lifestyle',
  },

  // ── Personality & values ───────────────────────────────────────────
  {
    id: 'q_036',
    text: 'What three words would your closest friends use to describe you?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_037',
    text: 'What is the one value you refuse to compromise on?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_038',
    text: 'Are you more of a planner or a spontaneous person?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_039',
    text: 'Do you tend to follow your head or your heart when making big decisions?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_040',
    text: 'What does success mean to you?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_041',
    text: 'Would you rather be very rich and unknown, or famous but average income?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_042',
    text: 'What is your biggest fear?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_043',
    text: 'Are you more competitive or collaborative by nature?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_044',
    text: 'Do you believe in second chances?',
    date: '',
    category: 'Personality',
  },
  {
    id: 'q_045',
    text: 'What quality do you most admire in other people?',
    date: '',
    category: 'Personality',
  },

  // ── Ambitions & dreams ─────────────────────────────────────────────
  {
    id: 'q_046',
    text: 'If you could master any skill overnight, what would it be?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_047',
    text: 'What is one place in the world you absolutely want to visit before you die?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_048',
    text: 'If money were no object, how would you spend your days?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_049',
    text: 'What is something you want to achieve in the next 5 years?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_050',
    text: 'If you could switch careers with anyone in the world for a year, who would it be?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_051',
    text: 'Is there a book, course, or project you keep putting off? What is it?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_052',
    text: 'What would you do if you knew you could not fail?',
    date: '',
    category: 'Ambition',
  },
  {
    id: 'q_053',
    text: 'What legacy do you want to leave behind?',
    date: '',
    category: 'Ambition',
  },

  // ── Pop culture & entertainment ────────────────────────────────────
  {
    id: 'q_054',
    text: 'What song is currently stuck in your head?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_055',
    text: 'What was the last movie or show that made you cry?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_056',
    text: 'Marvel or DC — and which superhero is your favorite?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_057',
    text: 'What video game (or type of game) do you enjoy most?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_058',
    text: 'What is a movie or show everyone loves that you actually dislike?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_059',
    text: 'What podcast, YouTube channel, or creator do you follow religiously?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_060',
    text: 'If your life had a theme song, what would it be?',
    date: '',
    category: 'Pop Culture',
  },
  {
    id: 'q_061',
    text: 'What decade of music do you think produced the best hits?',
    date: '',
    category: 'Pop Culture',
  },

  // ── Food & drink ───────────────────────────────────────────────────
  {
    id: 'q_062',
    text: 'What is one food you could eat every single day and never get tired of?',
    date: '',
    category: 'Food',
  },
  {
    id: 'q_063',
    text: 'What is a food that most people love that you absolutely hate?',
    date: '',
    category: 'Food',
  },
  {
    id: 'q_064',
    text: 'Sweet or savory — which do you always reach for first?',
    date: '',
    category: 'Food',
  },
  {
    id: 'q_065',
    text: 'What is the most adventurous thing you have ever eaten?',
    date: '',
    category: 'Food',
  },
  {
    id: 'q_066',
    text: 'What is your go-to comfort food when you are feeling low?',
    date: '',
    category: 'Food',
  },
  {
    id: 'q_067',
    text: 'If you could only eat the food of one country for the rest of your life, which would it be?',
    date: '',
    category: 'Food',
  },

  // ── Travel & nature ────────────────────────────────────────────────
  {
    id: 'q_068',
    text: 'Beach, mountains, or city — where do you feel most at home?',
    date: '',
    category: 'Travel',
  },
  {
    id: 'q_069',
    text: 'What is the best trip you have ever taken?',
    date: '',
    category: 'Travel',
  },
  {
    id: 'q_070',
    text: 'Do you prefer traveling solo, with a partner, or with a group?',
    date: '',
    category: 'Travel',
  },
  {
    id: 'q_071',
    text: 'What country would you live in if not your own?',
    date: '',
    category: 'Travel',
  },
  {
    id: 'q_072',
    text: 'What is a destination on your bucket list that you have never visited?',
    date: '',
    category: 'Travel',
  },

  // ── Technology & society ───────────────────────────────────────────
  {
    id: 'q_073',
    text: 'iPhone or Android — and would you ever switch?',
    date: '',
    category: 'Tech',
  },
  {
    id: 'q_074',
    text: 'How do you feel about artificial intelligence taking over more jobs?',
    date: '',
    category: 'Tech',
  },
  {
    id: 'q_075',
    text: 'Could you go a full week without social media? What would be the hardest part?',
    date: '',
    category: 'Tech',
  },
  {
    id: 'q_076',
    text: 'Do you think remote work is better or worse for society overall?',
    date: '',
    category: 'Tech',
  },
  {
    id: 'q_077',
    text: 'What technology from science fiction do you wish existed right now?',
    date: '',
    category: 'Tech',
  },

  // ── Relationships & social ─────────────────────────────────────────
  {
    id: 'q_078',
    text: 'What is the most important trait you look for in a friend?',
    date: '',
    category: 'Relationships',
  },
  {
    id: 'q_079',
    text: 'Do you have a best friend? What makes them irreplaceable?',
    date: '',
    category: 'Relationships',
  },
  {
    id: 'q_080',
    text: 'How do you prefer to resolve a conflict — talk it out, or take space first?',
    date: '',
    category: 'Relationships',
  },
  {
    id: 'q_081',
    text: 'What is a non-negotiable quality you look for in a romantic partner?',
    date: '',
    category: 'Relationships',
  },
  {
    id: 'q_082',
    text: 'Do you find it easy or hard to say "I love you" to people you care about?',
    date: '',
    category: 'Relationships',
  },
  {
    id: 'q_083',
    text: 'What is something you wish people understood about you without having to explain?',
    date: '',
    category: 'Relationships',
  },

  // ── Introspection ──────────────────────────────────────────────────
  {
    id: 'q_084',
    text: 'What is something you believed as a child that you now know is completely wrong?',
    date: '',
    category: 'Reflection',
  },
  {
    id: 'q_085',
    text: 'What is the best piece of advice you have ever received?',
    date: '',
    category: 'Reflection',
  },
  {
    id: 'q_086',
    text: 'What is one thing you would tell your 15-year-old self?',
    date: '',
    category: 'Reflection',
  },
  {
    id: 'q_087',
    text: 'What has been the defining moment of your life so far?',
    date: '',
    category: 'Reflection',
  },
  {
    id: 'q_088',
    text: 'What is something you regret not doing sooner?',
    date: '',
    category: 'Reflection',
  },
  {
    id: 'q_089',
    text: 'What are you most proud of about yourself?',
    date: '',
    category: 'Reflection',
  },
  {
    id: 'q_090',
    text: 'What is something you are working on becoming better at right now?',
    date: '',
    category: 'Reflection',
  },

  // ── This or that ───────────────────────────────────────────────────
  {
    id: 'q_091',
    text: 'Cats or dogs?',
    date: '',
    category: 'This or That',
  },
  {
    id: 'q_092',
    text: 'Books or movies as a way to tell a story?',
    date: '',
    category: 'This or That',
  },
  {
    id: 'q_093',
    text: 'Night out or cozy night in?',
    date: '',
    category: 'This or That',
  },
  {
    id: 'q_094',
    text: 'Hot weather or cold weather?',
    date: '',
    category: 'This or That',
  },
  {
    id: 'q_095',
    text: 'Texting or calling?',
    date: '',
    category: 'This or That',
  },
  {
    id: 'q_096',
    text: 'Working from home or from an office?',
    date: '',
    category: 'This or That',
  },
  {
    id: 'q_097',
    text: 'Early bird or night owl?',
    date: '',
    category: 'This or That',
  },

  // ── Wild cards ─────────────────────────────────────────────────────
  {
    id: 'q_098',
    text: 'If you could have dinner with any person, dead or alive, who would it be and why?',
    date: '',
    category: 'Wild Card',
  },
  {
    id: 'q_099',
    text: 'What is a random fun fact about yourself that most people do not know?',
    date: '',
    category: 'Wild Card',
  },
  {
    id: 'q_100',
    text: 'If you could live in any fictional universe (movie, book, game), which would you choose?',
    date: '',
    category: 'Wild Card',
  },
  {
    id: 'q_101',
    text: 'What is the weirdest dream you have ever had that you still remember?',
    date: '',
    category: 'Wild Card',
  },
  {
    id: 'q_102',
    text: 'If you had to eat only three foods for the rest of your life, what would they be?',
    date: '',
    category: 'Wild Card',
  },
  {
    id: 'q_103',
    text: 'What superpower would you choose, and what is the first thing you would do with it?',
    date: '',
    category: 'Wild Card',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

/** Returns today's question based on a deterministic rotation by date. */
export function getTodayQuestion(): Question {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % QUESTIONS.length;
  const q = QUESTIONS[index];
  return {
    ...q,
    date: today.toISOString().split('T')[0],
  };
}

/** Returns a question by id. */
export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** Category emoji map used by the UI. */
export const CATEGORY_EMOJI: Record<string, string> = {
  Identity: '🪪',
  Favorites: '⭐',
  Lifestyle: '🌿',
  Personality: '🧠',
  Ambition: '🚀',
  'Pop Culture': '🎬',
  Food: '🍽️',
  Travel: '✈️',
  Tech: '💻',
  Relationships: '❤️',
  Reflection: '🔮',
  'This or That': '⚖️',
  'Wild Card': '🃏',
};
