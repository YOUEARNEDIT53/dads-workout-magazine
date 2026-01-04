import Anthropic from '@anthropic-ai/sdk';
import { Logger, retry, ANTHROPIC_RETRY, countWords } from '@dads-workout/shared';
import { WriterProfile, ArticleContent } from '../types/content.js';

export interface GenerateArticleInput {
  topic: string;
  angle: string;
  relatedTopics?: string[];
  avoidTopics?: string[];
}

export abstract class BaseWriterAgent {
  protected anthropic: Anthropic;
  protected logger: Logger;
  abstract readonly profile: WriterProfile;
  abstract readonly systemPrompt: string;

  constructor(anthropic: Anthropic) {
    this.anthropic = anthropic;
    this.logger = new Logger('WriterAgent');
  }

  async generateArticle(input: GenerateArticleInput): Promise<ArticleContent> {
    this.logger.info(`Generating article for ${this.profile.name}`, {
      topic: input.topic,
      angle: input.angle,
    });

    const userPrompt = this.buildUserPrompt(input);

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

    return this.parseArticleResponse(response, input.topic);
  }

  private buildUserPrompt(input: GenerateArticleInput): string {
    let prompt = `Write your column on the following topic:

**Topic:** ${input.topic}

**Angle/Focus:** ${input.angle}

**Target Length:** ${this.profile.targetWordCount.min}-${this.profile.targetWordCount.max} words`;

    if (input.relatedTopics && input.relatedTopics.length > 0) {
      prompt += `\n\n**Related Topics to Consider:** ${input.relatedTopics.join(', ')}`;
    }

    if (input.avoidTopics && input.avoidTopics.length > 0) {
      prompt += `\n\n**Topics to Avoid (recently covered):** ${input.avoidTopics.join(', ')}`;
    }

    prompt += `\n\nProvide your article in the following format:

TITLE: [Your article title]

EXCERPT: [A 1-2 sentence hook/excerpt for previews]

CONTENT:
[Your full article content here]

Begin writing now.`;

    return prompt;
  }

  private parseArticleResponse(response: string, fallbackTopic: string): ArticleContent {
    // Extract title
    const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|EXCERPT:)/s);
    const title = titleMatch
      ? titleMatch[1].trim()
      : `${this.profile.name} on ${fallbackTopic}`;

    // Extract excerpt
    const excerptMatch = response.match(/EXCERPT:\s*(.+?)(?:\n\n|CONTENT:)/s);
    const excerpt = excerptMatch
      ? excerptMatch[1].trim()
      : '';

    // Extract content
    const contentMatch = response.match(/CONTENT:\s*([\s\S]+)/);
    const content = contentMatch
      ? contentMatch[1].trim()
      : response;

    const wordCount = countWords(content);

    // Extract topics from content
    const topics = this.extractTopics(content);

    this.logger.info(`Article generated`, {
      title,
      wordCount,
      topicsFound: topics.length,
    });

    return {
      title,
      content,
      excerpt,
      wordCount,
      topics,
    };
  }

  private extractTopics(content: string): string[] {
    // Simple topic extraction based on common fitness/health terms
    const topicPatterns = [
      'strength training', 'cardio', 'nutrition', 'protein', 'recovery',
      'sleep', 'stress', 'motivation', 'habit', 'injury', 'mobility',
      'flexibility', 'muscle', 'weight loss', 'energy', 'hydration',
      'meal prep', 'workout', 'exercise', 'core', 'back pain', 'joints'
    ];

    const lowerContent = content.toLowerCase();
    return topicPatterns.filter(topic => lowerContent.includes(topic));
  }
}
