import Anthropic from '@anthropic-ai/sdk';
import { Logger, retry, ANTHROPIC_RETRY, countWords } from '@dads-workout/shared';
import {
  ArticleContent,
  QuickWinContent,
  GearCornerContent,
  ReaderQAContent,
} from '../types/content.js';

export interface EditorInput {
  weekNumber: number;
  issueNumber: number;
  mainArticles: Array<ArticleContent & { authorName: string; authorTitle: string }>;
  wildcardColumn: ArticleContent & { authorName: string };
  challengeInfo: {
    title: string;
    week: number;
    milestone: string;
  };
}

export interface EditorOutput {
  editorsLetter: string;
  quickWins: QuickWinContent[];
  gearCorner: GearCornerContent;
  readerQA: ReaderQAContent[];
  challengeUpdate: string;
  issueTitle: string;
}

export class EditorAgent {
  private anthropic: Anthropic;
  private logger: Logger;

  private readonly systemPrompt = `You are the Editor-in-Chief for "Dad's Workout Health Magazine," a weekly fitness and wellness digest for active fathers ages 35-60.

YOUR ROLE:
You receive content from multiple expert writers and create the supporting editorial content that ties each issue together.

BRAND VOICE:
- Supportive and encouraging, never preachy or condescending
- Expert-backed but accessible to fitness newcomers
- Focused on busy dads who want results without sacrificing family time
- Celebrates progress over perfection
- Humorous when appropriate, but never at readers' expense

YOUR OUTPUTS:
1. Editor's Letter (200-300 words): Connect the week's themes, add personal touch, preview content
2. Quick Wins (3 tips, 50-75 words each): Immediately actionable, mix of workout/nutrition/mindset
3. Gear Corner (150-200 words): One honest product recommendation with pros/cons
4. Reader Q&A (2 questions, 100-150 words each): Practical answers matching expert perspectives
5. Challenge Update (100-150 words): Week-appropriate encouragement and tips

FORMAT: Always output valid JSON matching the specified structure.`;

  constructor(anthropic: Anthropic) {
    this.anthropic = anthropic;
    this.logger = new Logger('EditorAgent');
  }

  async compileEditorial(input: EditorInput): Promise<EditorOutput> {
    this.logger.info('Compiling editorial content', {
      issueNumber: input.issueNumber,
      weekNumber: input.weekNumber,
    });

    const userPrompt = this.buildPrompt(input);

    const response = await retry(
      async () => {
        const msg = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: this.systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const content = msg.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type');
        }
        return content.text;
      },
      ANTHROPIC_RETRY,
      this.logger
    );

    return this.parseResponse(response);
  }

  private buildPrompt(input: EditorInput): string {
    const articleSummaries = input.mainArticles
      .map(
        (a) => `- "${a.title}" by ${a.authorName} (${a.authorTitle}): ${a.excerpt || a.content.slice(0, 200)}...`
      )
      .join('\n');

    return `Create the editorial content for Issue #${input.issueNumber} (Week ${input.weekNumber}).

THIS WEEK'S MAIN COLUMNS:
${articleSummaries}

WILDCARD GUEST COLUMN:
- "${input.wildcardColumn.title}" by ${input.wildcardColumn.authorName}: ${input.wildcardColumn.excerpt || input.wildcardColumn.content.slice(0, 200)}...

MONTHLY CHALLENGE:
- Challenge: ${input.challengeInfo.title}
- Current Week: ${input.challengeInfo.week}
- This Week's Milestone: ${input.challengeInfo.milestone}

Generate the editorial content in the following JSON format:
{
  "issueTitle": "A catchy title for this week's issue (5-8 words)",
  "editorsLetter": "Your 200-300 word editor's letter here",
  "quickWins": [
    {
      "title": "Short tip title",
      "content": "50-75 word actionable tip",
      "category": "workout|nutrition|mindset|recovery|lifestyle"
    },
    {
      "title": "Second tip title",
      "content": "50-75 word actionable tip",
      "category": "workout|nutrition|mindset|recovery|lifestyle"
    },
    {
      "title": "Third tip title",
      "content": "50-75 word actionable tip",
      "category": "workout|nutrition|mindset|recovery|lifestyle"
    }
  ],
  "gearCorner": {
    "productName": "Product name",
    "description": "150-200 word honest review",
    "price": "$XX-$XX range",
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"]
  },
  "readerQA": [
    {
      "question": "Reader's question here?",
      "answer": "100-150 word expert answer",
      "answeringExpert": "Expert name who would answer this"
    },
    {
      "question": "Second reader question?",
      "answer": "100-150 word expert answer",
      "answeringExpert": "Expert name who would answer this"
    }
  ],
  "challengeUpdate": "100-150 word challenge update with encouragement and week-specific tips"
}

Output ONLY valid JSON, no markdown code blocks or additional text.`;
  }

  private parseResponse(response: string): EditorOutput {
    try {
      // Try to extract JSON from response
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.editorsLetter || !parsed.quickWins || !parsed.gearCorner) {
        throw new Error('Missing required fields in editor response');
      }

      return {
        issueTitle: parsed.issueTitle || 'Weekly Workout Wisdom',
        editorsLetter: parsed.editorsLetter,
        quickWins: parsed.quickWins.map((qw: QuickWinContent) => ({
          title: qw.title,
          content: qw.content,
          category: qw.category || 'lifestyle',
        })),
        gearCorner: {
          productName: parsed.gearCorner.productName,
          description: parsed.gearCorner.description,
          price: parsed.gearCorner.price,
          pros: parsed.gearCorner.pros || [],
          cons: parsed.gearCorner.cons || [],
        },
        readerQA: (parsed.readerQA || []).map((qa: ReaderQAContent) => ({
          question: qa.question,
          answer: qa.answer,
          answeringExpert: qa.answeringExpert || 'The Editors',
        })),
        challengeUpdate: parsed.challengeUpdate || '',
      };
    } catch (error) {
      this.logger.error('Failed to parse editor response', error);
      throw new Error(`Failed to parse editor response: ${error}`);
    }
  }
}
