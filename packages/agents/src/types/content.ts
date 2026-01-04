export interface WriterProfile {
  id: string;
  name: string;
  title: string;
  credentials: string;
  expertise: string[];
  writingStyle: string;
  targetWordCount: { min: number; max: number };
}

export interface ArticleContent {
  title: string;
  content: string;
  excerpt: string;
  wordCount: number;
  topics: string[];
  authorId?: string;
  authorName?: string;
  authorTitle?: string;
}

export interface WriterAssignment {
  writerId: string;
  topic: string;
  angle: string;
  relatedTopics: string[];
}

export interface QuickWinContent {
  title: string;
  content: string;
  category: 'workout' | 'nutrition' | 'mindset' | 'recovery' | 'lifestyle';
}

export interface ReaderQAContent {
  question: string;
  answer: string;
  answeringExpert: string;
}

export interface GearCornerContent {
  productName: string;
  description: string;
  price: string;
  pros: string[];
  cons: string[];
}

export interface CompiledDigest {
  issueNumber: number;
  weekNumber: number;
  year: number;
  title: string;
  slug: string;
  editorsLetter: string;
  mainArticles: ArticleContent[];
  wildcardColumn: ArticleContent;
  quickWins: QuickWinContent[];
  gearCorner: GearCornerContent;
  readerQA: ReaderQAContent[];
  challengeUpdate: string;
  writerAssignments: WriterAssignment[];
}

export interface WeekPlan {
  weekNumber: number;
  issueNumber: number;
  selectedWriters: WriterAssignment[];
  wildcardPersonaId: string;
  currentChallenge: {
    title: string;
    week: number;
    milestone: string;
  };
  recentTopics: string[];
}
