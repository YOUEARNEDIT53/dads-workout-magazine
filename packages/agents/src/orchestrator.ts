import Anthropic from '@anthropic-ai/sdk';
import { Logger, config } from '@dads-workout/shared';
import {
  IssueRepository,
  ArticleRepository,
  QuickWinRepository,
  ReaderQARepository,
} from '@dads-workout/database';
import { TopicPlanner } from './planner/index.js';
import {
  createWriterAgent,
  WildcardAgent,
  WRITER_PROFILES,
  WriterAgentId,
} from './writers/index.js';
import { EditorAgent } from './editor/index.js';
import { CompiledDigest, WeekPlan } from './types/content.js';

export interface GenerationResult {
  issueId: string;
  issueNumber: number;
  slug: string;
  digest: CompiledDigest;
}

export class DigestOrchestrator {
  private anthropic: Anthropic;
  private planner: TopicPlanner;
  private editorAgent: EditorAgent;
  private wildcardAgent: WildcardAgent;
  private issueRepo: IssueRepository;
  private articleRepo: ArticleRepository;
  private quickWinRepo: QuickWinRepository;
  private readerQARepo: ReaderQARepository;
  private logger: Logger;

  constructor() {
    const cfg = config();
    this.anthropic = new Anthropic({ apiKey: cfg.anthropic.apiKey });
    this.planner = new TopicPlanner(this.anthropic);
    this.editorAgent = new EditorAgent(this.anthropic);
    this.wildcardAgent = new WildcardAgent(this.anthropic);
    this.issueRepo = new IssueRepository();
    this.articleRepo = new ArticleRepository();
    this.quickWinRepo = new QuickWinRepository();
    this.readerQARepo = new ReaderQARepository();
    this.logger = new Logger('Orchestrator');
  }

  async generateWeeklyDigest(): Promise<GenerationResult> {
    this.logger.info('Starting weekly digest generation');

    // Step 1: Plan the week
    this.logger.info('Step 1: Planning week content');
    const plan = await this.planner.planWeek();
    this.logger.info('Week planned', {
      issueNumber: plan.issueNumber,
      writers: plan.selectedWriters.map((w) => w.writerId),
      wildcard: plan.wildcardPersonaId,
    });

    // Step 2: Generate main articles in parallel
    this.logger.info('Step 2: Generating main articles');
    const mainArticles = await Promise.all(
      plan.selectedWriters.map(async (assignment) => {
        const agent = createWriterAgent(assignment.writerId as WriterAgentId, this.anthropic);
        const article = await agent.generateArticle({
          topic: assignment.topic,
          angle: assignment.angle,
          relatedTopics: assignment.relatedTopics,
          avoidTopics: plan.recentTopics,
        });
        const profile = WRITER_PROFILES[assignment.writerId as WriterAgentId];
        return {
          ...article,
          authorId: assignment.writerId,
          authorName: profile.name,
          authorTitle: profile.title,
        };
      })
    );
    this.logger.info('Main articles generated', {
      count: mainArticles.length,
      titles: mainArticles.map((a) => a.title),
    });

    // Step 3: Generate wildcard column
    this.logger.info('Step 3: Generating wildcard column');
    const wildcardResult = await this.wildcardAgent.generateArticle(
      plan.wildcardPersonaId,
      'Fitness wisdom from an unexpected source',
      'A fresh, humorous take on staying fit as a dad'
    );
    const wildcardColumn = {
      ...wildcardResult,
      authorId: plan.wildcardPersonaId,
      authorName: wildcardResult.persona.name,
    };
    this.logger.info('Wildcard column generated', {
      title: wildcardColumn.title,
      author: wildcardColumn.authorName,
    });

    // Step 4: Editor compiles supporting content
    this.logger.info('Step 4: Editor compiling editorial content');
    const editorOutput = await this.editorAgent.compileEditorial({
      weekNumber: plan.weekNumber,
      issueNumber: plan.issueNumber,
      mainArticles: mainArticles.map((a) => ({
        ...a,
        authorTitle: a.authorTitle,
      })),
      wildcardColumn: {
        ...wildcardColumn,
        authorName: wildcardColumn.authorName,
      },
      challengeInfo: plan.currentChallenge,
    });
    this.logger.info('Editorial content compiled', {
      issueTitle: editorOutput.issueTitle,
      quickWins: editorOutput.quickWins.length,
    });

    // Step 5: Compile final digest
    const now = new Date();
    const slug = `issue-${plan.issueNumber}-${now.toISOString().slice(0, 10)}`;

    const digest: CompiledDigest = {
      issueNumber: plan.issueNumber,
      weekNumber: plan.weekNumber,
      year: now.getFullYear(),
      title: editorOutput.issueTitle,
      slug,
      editorsLetter: editorOutput.editorsLetter,
      mainArticles: mainArticles,
      wildcardColumn: wildcardColumn,
      quickWins: editorOutput.quickWins,
      gearCorner: editorOutput.gearCorner,
      readerQA: editorOutput.readerQA,
      challengeUpdate: editorOutput.challengeUpdate,
      writerAssignments: plan.selectedWriters,
    };

    // Step 6: Store in database
    this.logger.info('Step 6: Storing issue in database');
    const issue = await this.storeDigest(digest);
    this.logger.info('Issue stored', { issueId: issue.id, slug });

    return {
      issueId: issue.id,
      issueNumber: plan.issueNumber,
      slug,
      digest,
    };
  }

  private async storeDigest(digest: CompiledDigest) {
    // Create the issue
    const issue = await this.issueRepo.createIssue({
      issue_number: digest.issueNumber,
      week_number: digest.weekNumber,
      year: digest.year,
      title: digest.title,
      slug: digest.slug,
      editors_letter: digest.editorsLetter,
      gear_corner: digest.gearCorner,
      challenge_update: digest.challengeUpdate,
    });

    // Store main articles
    let position = 1;
    for (const article of digest.mainArticles) {
      await this.articleRepo.createArticle({
        issue_id: issue.id,
        author_id: article.authorId!,
        author_name: article.authorName!,
        author_title: article.authorTitle,
        title: article.title,
        slug: this.slugify(article.title),
        content: article.content,
        excerpt: article.excerpt,
        word_count: article.wordCount,
        article_type: 'main_column',
        position: position++,
        topics: article.topics,
      });
    }

    // Store wildcard column
    await this.articleRepo.createArticle({
      issue_id: issue.id,
      author_id: digest.wildcardColumn.authorId!,
      author_name: digest.wildcardColumn.authorName!,
      author_title: 'Guest Columnist',
      title: digest.wildcardColumn.title,
      slug: this.slugify(digest.wildcardColumn.title),
      content: digest.wildcardColumn.content,
      excerpt: digest.wildcardColumn.excerpt,
      word_count: digest.wildcardColumn.wordCount,
      article_type: 'wildcard',
      position: position++,
      topics: [],
    });

    // Store quick wins
    for (let i = 0; i < digest.quickWins.length; i++) {
      const qw = digest.quickWins[i];
      await this.quickWinRepo.createQuickWin({
        issue_id: issue.id,
        title: qw.title,
        content: qw.content,
        category: qw.category,
        position: i + 1,
      });
    }

    // Store reader Q&A
    for (let i = 0; i < digest.readerQA.length; i++) {
      const qa = digest.readerQA[i];
      await this.readerQARepo.createReaderQA({
        issue_id: issue.id,
        question: qa.question,
        answer: qa.answer,
        answering_expert: qa.answeringExpert,
        position: i + 1,
      });
    }

    return issue;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100);
  }
}
