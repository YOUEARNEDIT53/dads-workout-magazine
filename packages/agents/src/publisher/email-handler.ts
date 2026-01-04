import { Resend } from 'resend';
import { Logger, config, retry, RESEND_RETRY } from '@dads-workout/shared';
import { SubscriberRepository, IssueRepository } from '@dads-workout/database';
import {
  generateDigestEmailHtml,
  generateDigestEmailText,
  DigestEmailData,
} from '@dads-workout/email-templates';
import { CompiledDigest } from '../types/content.js';

export class EmailHandler {
  private resend: Resend;
  private subscriberRepo: SubscriberRepository;
  private issueRepo: IssueRepository;
  private logger: Logger;
  private cfg = config();

  constructor() {
    if (!this.cfg.resend.apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required for email sending');
    }
    this.resend = new Resend(this.cfg.resend.apiKey);
    this.subscriberRepo = new SubscriberRepository();
    this.issueRepo = new IssueRepository();
    this.logger = new Logger('EmailHandler');
  }

  async sendDigest(issueId: string, digest: CompiledDigest, pdfUrl?: string): Promise<number> {
    this.logger.info('Preparing to send digest email', { issueId });

    // Get active subscribers
    const subscribers = await this.subscriberRepo.getActiveSubscribers();
    this.logger.info('Found active subscribers', { count: subscribers.length });

    if (subscribers.length === 0) {
      this.logger.warn('No active subscribers found');
      return 0;
    }

    // Prepare email data
    const baseUrl = this.cfg.app.siteUrl;
    const emailData = this.prepareEmailData(digest, baseUrl, pdfUrl);

    // Generate HTML and text versions
    const html = generateDigestEmailHtml(emailData);
    const text = generateDigestEmailText(emailData);

    // Send to each subscriber
    let sentCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        await this.sendToSubscriber(subscriber.email, digest.title, html, text);
        sentCount++;
        this.logger.info('Email sent', { email: subscriber.email });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`${subscriber.email}: ${msg}`);
        this.logger.error('Failed to send email', { email: subscriber.email, error: msg });
      }

      // Small delay between sends to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update issue with email sent info
    await this.issueRepo.markEmailSent(issueId, sentCount);

    if (errors.length > 0) {
      this.logger.warn('Some emails failed to send', { errors });
    }

    this.logger.info('Digest email send complete', { sent: sentCount, failed: errors.length });
    return sentCount;
  }

  private prepareEmailData(
    digest: CompiledDigest,
    baseUrl: string,
    pdfUrl?: string
  ): DigestEmailData {
    return {
      issueNumber: digest.issueNumber,
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      issueTitle: digest.title,
      editorsLetter: digest.editorsLetter,
      mainArticles: digest.mainArticles.map((a) => ({
        title: a.title,
        authorName: a.authorName || 'Staff Writer',
        authorTitle: a.authorTitle || '',
        content: a.content,
        excerpt: a.excerpt || a.content.slice(0, 200) + '...',
      })),
      wildcardColumn: {
        title: digest.wildcardColumn.title,
        authorName: digest.wildcardColumn.authorName || 'Guest Columnist',
        content: digest.wildcardColumn.content,
        excerpt: digest.wildcardColumn.excerpt || digest.wildcardColumn.content.slice(0, 150) + '...',
      },
      quickWins: digest.quickWins.map((qw) => ({
        title: qw.title,
        content: qw.content,
        category: qw.category,
      })),
      gearCorner: digest.gearCorner,
      readerQA: digest.readerQA.map((qa) => ({
        question: qa.question,
        answer: qa.answer,
        expert: qa.answeringExpert,
      })),
      challengeUpdate: {
        title: 'Monthly Challenge',
        week: digest.weekNumber % 4 || 4,
        content: digest.challengeUpdate,
      },
      pdfUrl,
      unsubscribeUrl: `${baseUrl}/unsubscribe`,
    };
  }

  private async sendToSubscriber(
    email: string,
    subject: string,
    html: string,
    text: string
  ): Promise<void> {
    await retry(
      async () => {
        const { error } = await this.resend.emails.send({
          from: this.cfg.resend.emailFrom,
          to: email,
          subject: `Dad's Workout: ${subject}`,
          html,
          text,
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      RESEND_RETRY,
      this.logger
    );
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
