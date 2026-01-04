import { Logger } from '@dads-workout/shared';
import { EmailHandler } from '@dads-workout/agents';
import { IssueRepository, ArticleRepository, QuickWinRepository, ReaderQARepository } from '@dads-workout/database';
import { CompiledDigest } from '@dads-workout/agents';

const logger = new Logger('SendEmail');

async function main() {
  const issueId = process.argv[2]?.replace('--issue=', '');

  if (!issueId) {
    logger.error('Missing issue ID. Usage: send-email --issue=<issue-id>');
    process.exit(1);
  }

  logger.info('Sending digest email...', { issueId });

  try {
    // Load the issue from database
    const issueRepo = new IssueRepository();
    const articleRepo = new ArticleRepository();
    const quickWinRepo = new QuickWinRepository();
    const readerQARepo = new ReaderQARepository();

    const issue = await issueRepo.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const articles = await articleRepo.getArticlesForIssue(issueId);
    const quickWins = await quickWinRepo.getQuickWinsForIssue(issueId);
    const readerQA = await readerQARepo.getReaderQAForIssue(issueId);

    // Reconstruct the digest
    const mainArticles = articles.filter((a) => a.article_type === 'main_column');
    const wildcardArticle = articles.find((a) => a.article_type === 'wildcard');

    const digest: CompiledDigest = {
      issueNumber: issue.issue_number,
      weekNumber: issue.week_number,
      year: issue.year,
      title: issue.title,
      slug: issue.slug,
      editorsLetter: issue.editors_letter,
      mainArticles: mainArticles.map((a) => ({
        title: a.title,
        content: a.content,
        excerpt: a.excerpt || '',
        wordCount: a.word_count,
        topics: a.topics,
        authorId: a.author_id,
        authorName: a.author_name,
        authorTitle: a.author_title || '',
      })),
      wildcardColumn: wildcardArticle
        ? {
            title: wildcardArticle.title,
            content: wildcardArticle.content,
            excerpt: wildcardArticle.excerpt || '',
            wordCount: wildcardArticle.word_count,
            topics: [],
            authorId: wildcardArticle.author_id,
            authorName: wildcardArticle.author_name,
          }
        : {
            title: 'Guest Column',
            content: '',
            excerpt: '',
            wordCount: 0,
            topics: [],
          },
      quickWins: quickWins.map((qw) => ({
        title: qw.title,
        content: qw.content,
        category: qw.category,
      })),
      gearCorner: issue.gear_corner,
      readerQA: readerQA.map((qa) => ({
        question: qa.question,
        answer: qa.answer,
        answeringExpert: qa.answering_expert || 'The Editors',
      })),
      challengeUpdate: issue.challenge_update || '',
      writerAssignments: [],
    };

    // Send the email
    const emailHandler = new EmailHandler();
    const sentCount = await emailHandler.sendDigest(issueId, digest, issue.pdf_url || undefined);

    logger.info('Email send complete', { sentCount });

    console.log(
      JSON.stringify({
        success: true,
        sentCount,
      })
    );

    process.exit(0);
  } catch (error) {
    logger.error('Failed to send email', error);

    console.log(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    );

    process.exit(1);
  }
}

main();
