import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { config, Logger } from '@dads-workout/shared';
import { getSupabase } from '@dads-workout/database';

const logger = new Logger('HealthCheck');

async function checkAnthropic(): Promise<boolean> {
  try {
    const cfg = config();
    const anthropic = new Anthropic({ apiKey: cfg.anthropic.apiKey });

    // Quick test with minimal tokens
    await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });

    logger.info('Anthropic API: OK');
    return true;
  } catch (error) {
    logger.error('Anthropic API: FAILED', error);
    return false;
  }
}

async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('subscribers').select('id').limit(1);

    if (error) throw error;

    logger.info('Supabase: OK');
    return true;
  } catch (error) {
    logger.error('Supabase: FAILED', error);
    return false;
  }
}

async function checkResend(): Promise<boolean> {
  try {
    const cfg = config();
    const resend = new Resend(cfg.resend.apiKey);

    // Just verify the API key is valid by checking domains
    await resend.domains.list();

    logger.info('Resend: OK');
    return true;
  } catch (error) {
    logger.error('Resend: FAILED', error);
    return false;
  }
}

async function main() {
  logger.info('Starting health checks...');

  const results = await Promise.all([
    checkAnthropic(),
    checkSupabase(),
    checkResend(),
  ]);

  const allPassed = results.every((r) => r);

  if (allPassed) {
    logger.info('All health checks passed!');
    process.exit(0);
  } else {
    logger.error('Some health checks failed');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Health check crashed', error);
  process.exit(1);
});
