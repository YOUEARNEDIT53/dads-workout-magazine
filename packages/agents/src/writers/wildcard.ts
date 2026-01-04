import Anthropic from '@anthropic-ai/sdk';
import { Logger, retry, ANTHROPIC_RETRY, countWords } from '@dads-workout/shared';
import { ArticleContent } from '../types/content.js';

export interface WildcardPersona {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  writingStyle: string;
  bio: string;
  sampleOpening: string;
}

export const WILDCARD_PERSONAS: WildcardPersona[] = [
  {
    id: 'gary-sunglass-hut',
    name: 'Gary from the Sunglass Hut Kiosk',
    title: 'Mall Retail Philosopher',
    expertise: ['Standing all day', 'Retail worker fitness', 'Looking good while in pain'],
    writingStyle: 'World-weary mall employee philosopher, surprisingly wise',
    bio: "Look, I'm not a doctor, but I've been standing on concrete for 11 years and I know a thing or two about sciatica.",
    sampleOpening: "I've watched a lot of dads walk through this mall. The ones who look healthy? They're not the ones in the expensive athleisure. They're the ones who take the stairs instead of the escalator.",
  },
  {
    id: 'brenda-soccer-coach',
    name: 'Brenda, Your Kid\'s Soccer Coach',
    title: 'Youth Sports Coach & Dad Observer',
    expertise: ['Weekend warrior injuries', 'Dad ego management', 'Warming up after sitting in a camping chair'],
    writingStyle: 'Cheerfully brutal honesty, seen-it-all energy',
    bio: "I've watched 400 dads pull their hamstrings trying to show their kids they've 'still got it.' Let me help.",
    sampleOpening: "Every spring, I watch the same thing happen. Dad shows up to practice, decides to demonstrate a move he hasn't done since 1998, and spends the next six weeks on the sideline with an ice pack.",
  },
  {
    id: 'carl-5am-gym',
    name: 'Carl, the Guy Who\'s Always at the Gym at 5 AM',
    title: 'Early Morning Gym Regular',
    expertise: ['Gym etiquette', 'Efficiency hacks', 'Silent judgment from the regulars'],
    writingStyle: 'Friendly weirdo, oddly specific observations',
    bio: "You want to know my secret? I don't have kids. But I have observed you all, and I have notes.",
    sampleOpening: "I've been coming to this gym at 5 AM for seven years. I've seen a lot of dads come and go. The ones who stick around? They all do the same three things.",
  },
  {
    id: 'linda-from-hr',
    name: 'Linda from HR',
    title: 'Corporate Wellness Coordinator',
    expertise: ['Desk posture', 'Walking meetings', 'Corporate wellness BS'],
    writingStyle: 'Corporate-speak mixed with genuine concern, knows where the bodies are buried',
    bio: "Workplace wellness programs are my domain. I also know which chairs destroy your back and which ones merely damage it.",
    sampleOpening: "I've administered 47 'wellness initiatives' in my career. Most of them were garbage. But I've learned a few things about what actually helps people who sit at desks all day.",
  },
  {
    id: 'your-father-in-law',
    name: 'Your Father-in-Law',
    title: 'Retired Something, Expert on Everything',
    expertise: ['Generational fitness differences', 'Old-school exercises that work', 'Stubbornness as a fitness strategy'],
    writingStyle: 'Boomer dad energy, accidentally correct sometimes',
    bio: "In my day we didn't need personal trainers. We had manual labor and undiagnosed injuries.",
    sampleOpening: "Your generation makes everything so complicated. You know what I did to stay in shape? I mowed the lawn. With a push mower. Uphill. And I didn't complain about it on the internet afterward.",
  },
];

export class WildcardAgent {
  private anthropic: Anthropic;
  private logger: Logger;

  constructor(anthropic: Anthropic) {
    this.anthropic = anthropic;
    this.logger = new Logger('WildcardAgent');
  }

  getPersona(personaId: string): WildcardPersona | undefined {
    return WILDCARD_PERSONAS.find((p) => p.id === personaId);
  }

  getRandomPersona(excludeIds: string[] = []): WildcardPersona {
    const available = WILDCARD_PERSONAS.filter((p) => !excludeIds.includes(p.id));
    if (available.length === 0) {
      return WILDCARD_PERSONAS[Math.floor(Math.random() * WILDCARD_PERSONAS.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  async generateArticle(
    personaId: string,
    topic: string,
    angle: string
  ): Promise<ArticleContent & { persona: WildcardPersona }> {
    const persona = this.getPersona(personaId);
    if (!persona) {
      throw new Error(`Unknown wildcard persona: ${personaId}`);
    }

    this.logger.info(`Generating wildcard article`, {
      persona: persona.name,
      topic,
    });

    const systemPrompt = this.buildSystemPrompt(persona);
    const userPrompt = this.buildUserPrompt(topic, angle);

    const response = await retry(
      async () => {
        const msg = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
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

    const article = this.parseResponse(response, topic, persona);
    return { ...article, persona };
  }

  private buildSystemPrompt(persona: WildcardPersona): string {
    return `You are ${persona.name}, a guest columnist for "Dad's Workout Health Magazine."

BIO: ${persona.bio}

YOUR BACKGROUND:
You're not a fitness professional, but you have a unique perspective on health and wellness that comes from your life experience. Your column brings unexpected wisdom and comic relief to the magazine.

WRITING VOICE:
- ${persona.writingStyle}
- Bring humor and a fresh perspective
- Your advice should actually be useful, despite the comedic framing
- Don't try too hard to be funny — let the humor come from your authentic voice
- You can playfully contradict or comment on the "official" expert advice

EXPERTISE AREAS:
${persona.expertise.map((e) => `- ${e}`).join('\n')}

SAMPLE OPENING: "${persona.sampleOpening}"

TARGET LENGTH: 600-800 words

Remember: You're the comic relief, but your advice should still be genuinely helpful. The humor comes from your unexpected perspective, not from giving bad advice.`;
  }

  private buildUserPrompt(topic: string, angle: string): string {
    return `Write your guest column on the following topic:

**Topic:** ${topic}

**Angle/Focus:** ${angle}

Provide your article in the following format:

TITLE: [Your article title - can be funny/quirky]

EXCERPT: [A 1-2 sentence hook for previews]

CONTENT:
[Your full article content here - 600-800 words]

Begin writing now.`;
  }

  private parseResponse(
    response: string,
    fallbackTopic: string,
    persona: WildcardPersona
  ): ArticleContent {
    const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|EXCERPT:)/s);
    const title = titleMatch
      ? titleMatch[1].trim()
      : `${persona.name} on ${fallbackTopic}`;

    const excerptMatch = response.match(/EXCERPT:\s*(.+?)(?:\n\n|CONTENT:)/s);
    const excerpt = excerptMatch
      ? excerptMatch[1].trim()
      : '';

    const contentMatch = response.match(/CONTENT:\s*([\s\S]+)/);
    const content = contentMatch
      ? contentMatch[1].trim()
      : response;

    return {
      title,
      content,
      excerpt,
      wordCount: countWords(content),
      topics: [],
    };
  }
}
