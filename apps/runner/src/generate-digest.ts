import { Logger } from '@dads-workout/shared';
import { DigestOrchestrator } from '@dads-workout/agents';

const logger = new Logger('GenerateDigest');

async function main() {
  logger.info('Starting weekly digest generation...');

  const orchestrator = new DigestOrchestrator();

  try {
    const result = await orchestrator.generateWeeklyDigest();

    logger.info('Digest generated successfully!', {
      issueId: result.issueId,
      issueNumber: result.issueNumber,
      slug: result.slug,
    });

    // Output result as JSON for GitHub Actions
    console.log(
      JSON.stringify({
        success: true,
        issueId: result.issueId,
        issueNumber: result.issueNumber,
        issueSlug: result.slug,
      })
    );

    process.exit(0);
  } catch (error) {
    logger.error('Failed to generate digest', error);

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
