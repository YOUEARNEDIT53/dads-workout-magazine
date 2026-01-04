import Anthropic from '@anthropic-ai/sdk';
import { Logger, retry, ANTHROPIC_RETRY } from '@dads-workout/shared';
import {
  TopicRepository,
  ChallengeRepository,
  IssueRepository,
} from '@dads-workout/database';
import {
  WriterAgentId,
  getWritersForWeek,
  WRITER_PROFILES,
  WILDCARD_PERSONAS,
} from '../writers/index.js';
import { WriterAssignment, WeekPlan } from '../types/content.js';

// Map writer IDs to topic categories
const WRITER_CATEGORIES: Record<WriterAgentId, string[]> = {
  'dr-marcus-chen': ['mental', 'motivation', 'habit', 'stress'],
  'dr-angela-okafor': ['injury', 'mobility', 'recovery', 'joints'],
  'coach-dt-thompson': ['training', 'equipment', 'programming', 'workout'],
  'maya-santana': ['nutrition', 'meal-prep', 'supplements', 'hydration'],
};

export class TopicPlanner {
  private anthropic: Anthropic;
  private topicRepo: TopicRepository;
  private challengeRepo: ChallengeRepository;
  private issueRepo: IssueRepository;
  private logger: Logger;

  constructor(anthropic: Anthropic) {
    this.anthropic = anthropic;
    this.topicRepo = new TopicRepository();
    this.challengeRepo = new ChallengeRepository();
    this.issueRepo = new IssueRepository();
    this.logger = new Logger('TopicPlanner');
  }

  async planWeek(): Promise<WeekPlan> {
    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    this.logger.info('Planning week', { weekNumber, year });

    // Get next issue number
    const issueNumber = await this.issueRepo.getNextIssueNumber();

    // Get writers for this week's rotation
    const writerIds = getWritersForWeek(weekNumber);
    this.logger.info('Writers for this week', { writerIds });

    // Get recently used topics to avoid
    const recentTopics = await this.topicRepo.getRecentlyUsedTopics(8);
    this.logger.info('Recent topics to avoid', { count: recentTopics.length });

    // Assign topics to each writer
    const selectedWriters: WriterAssignment[] = [];
    const usedTopicsThisWeek: string[] = [...recentTopics];

    for (const writerId of writerIds) {
      const assignment = await this.assignTopicToWriter(writerId, usedTopicsThisWeek);
      selectedWriters.push(assignment);
      usedTopicsThisWeek.push(assignment.topic);
    }

    // Select wildcard persona (avoid recently used)
    const wildcardPersonaId = this.selectWildcardPersona();

    // Get current challenge info
    const challenge = await this.challengeRepo.getActiveChallenge();
    const challengeWeek = await this.challengeRepo.getCurrentWeekOfMonth();
    const currentChallenge = challenge
      ? {
          title: challenge.title,
          week: challengeWeek,
          milestone:
            challenge.weekly_milestones.find((m) => m.week === challengeWeek)?.goal || '',
        }
      : { title: 'No active challenge', week: 1, milestone: '' };

    return {
      weekNumber,
      issueNumber,
      selectedWriters,
      wildcardPersonaId,
      currentChallenge,
      recentTopics,
    };
  }

  private async assignTopicToWriter(
    writerId: WriterAgentId,
    excludeTopics: string[]
  ): Promise<WriterAssignment> {
    const categories = WRITER_CATEGORIES[writerId];
    const writerProfile = WRITER_PROFILES[writerId];

    // Get available topics for this writer's expertise
    const availableTopics = await this.topicRepo.getAvailableTopics(
      categories,
      excludeTopics,
      8
    );

    let topic: string;
    let relatedTopics: string[] = [];

    if (availableTopics.length > 0) {
      // Use an existing topic from the database
      const selectedTopic = availableTopics[0];
      topic = selectedTopic.topic_name;

      // Get related topics in the same category
      const categoryTopics = await this.topicRepo.getTopicsByCategory(
        selectedTopic.category
      );
      relatedTopics = categoryTopics
        .filter((t) => t.topic_name !== topic)
        .slice(0, 3)
        .map((t) => t.topic_name);
    } else {
      // Fallback: generate a topic based on expertise
      topic = await this.generateFreshTopic(writerId);
    }

    // Generate a unique angle for this topic
    const angle = await this.generateAngle(writerId, topic);

    this.logger.info('Assigned topic to writer', {
      writerId,
      topic,
      angle,
    });

    return {
      writerId,
      topic,
      angle,
      relatedTopics,
    };
  }

  private async generateFreshTopic(writerId: WriterAgentId): Promise<string> {
    const profile = WRITER_PROFILES[writerId];

    const response = await retry(
      async () => {
        const msg = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `Generate ONE specific, actionable topic for a ${profile.title} to write about for busy dads trying to stay fit.

The topic should be:
- Specific and focused (not broad like "fitness" but specific like "morning stretches for desk workers")
- Relevant to dads aged 35-60
- Practical and immediately useful

Output ONLY the topic name, nothing else.`,
            },
          ],
        });

        const content = msg.content[0];
        if (content.type !== 'text') throw new Error('Unexpected response');
        return content.text.trim();
      },
      ANTHROPIC_RETRY,
      this.logger
    );

    return response;
  }

  private async generateAngle(writerId: WriterAgentId, topic: string): Promise<string> {
    const profile = WRITER_PROFILES[writerId];

    const response = await retry(
      async () => {
        const msg = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          messages: [
            {
              role: 'user',
              content: `Generate a unique, specific angle for ${profile.name} (${profile.title}) to cover the topic "${topic}" for busy dads.

The angle should:
- Be fresh and interesting
- Match the expert's specialty
- Have a clear point of view
- Be achievable in 1000-1500 words

Output ONLY the angle in 1-2 sentences, nothing else.`,
            },
          ],
        });

        const content = msg.content[0];
        if (content.type !== 'text') throw new Error('Unexpected response');
        return content.text.trim();
      },
      ANTHROPIC_RETRY,
      this.logger
    );

    return response;
  }

  private selectWildcardPersona(): string {
    // For now, random selection. In production, track recent usage in DB
    const randomIndex = Math.floor(Math.random() * WILDCARD_PERSONAS.length);
    return WILDCARD_PERSONAS[randomIndex].id;
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
}
