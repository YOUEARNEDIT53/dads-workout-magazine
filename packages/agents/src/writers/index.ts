import Anthropic from '@anthropic-ai/sdk';
import { BaseWriterAgent } from './base-writer.js';
import { DrMarcusChenAgent } from './dr-marcus-chen.js';
import { DrAngelaOkaforAgent } from './dr-angela-okafor.js';
import { CoachDTThompsonAgent } from './coach-dt-thompson.js';
import { MayaSantanaAgent } from './maya-santana.js';
import { WildcardAgent, WILDCARD_PERSONAS, WildcardPersona } from './wildcard.js';

export { BaseWriterAgent } from './base-writer.js';
export { DrMarcusChenAgent } from './dr-marcus-chen.js';
export { DrAngelaOkaforAgent } from './dr-angela-okafor.js';
export { CoachDTThompsonAgent } from './coach-dt-thompson.js';
export { MayaSantanaAgent } from './maya-santana.js';
export { WildcardAgent, WILDCARD_PERSONAS } from './wildcard.js';
export type { WildcardPersona } from './wildcard.js';

export type WriterAgentId =
  | 'dr-marcus-chen'
  | 'dr-angela-okafor'
  | 'coach-dt-thompson'
  | 'maya-santana';

export const WRITER_PROFILES: Record<WriterAgentId, { name: string; title: string }> = {
  'dr-marcus-chen': { name: 'Dr. Marcus Chen', title: 'Sports Psychiatrist' },
  'dr-angela-okafor': { name: 'Dr. Angela Okafor', title: 'Orthopedic Surgeon' },
  'coach-dt-thompson': { name: 'Coach DT Thompson', title: 'Personal Trainer & Strength Coach' },
  'maya-santana': { name: 'Maya Santana, RD', title: 'Registered Dietitian' },
};

export function createWriterAgent(
  writerId: WriterAgentId,
  anthropic: Anthropic
): BaseWriterAgent {
  switch (writerId) {
    case 'dr-marcus-chen':
      return new DrMarcusChenAgent(anthropic);
    case 'dr-angela-okafor':
      return new DrAngelaOkaforAgent(anthropic);
    case 'coach-dt-thompson':
      return new CoachDTThompsonAgent(anthropic);
    case 'maya-santana':
      return new MayaSantanaAgent(anthropic);
    default:
      throw new Error(`Unknown writer ID: ${writerId}`);
  }
}

// 4-week rotation schedule
export const ROTATION_SCHEDULE: { week: number; writers: WriterAgentId[] }[] = [
  { week: 1, writers: ['dr-marcus-chen', 'dr-angela-okafor'] },
  { week: 2, writers: ['coach-dt-thompson', 'maya-santana'] },
  { week: 3, writers: ['dr-angela-okafor', 'dr-marcus-chen'] },
  { week: 4, writers: ['maya-santana', 'coach-dt-thompson'] },
];

export function getWritersForWeek(weekNumber: number): WriterAgentId[] {
  const rotationWeek = ((weekNumber - 1) % 4) + 1;
  const schedule = ROTATION_SCHEDULE.find((s) => s.week === rotationWeek);
  return schedule ? schedule.writers : ROTATION_SCHEDULE[0].writers;
}
