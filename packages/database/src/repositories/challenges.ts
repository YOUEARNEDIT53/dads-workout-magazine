import { getSupabase, MonthlyChallenge } from '../client.js';

export class ChallengeRepository {
  private supabase = getSupabase();

  async getActiveChallenge(): Promise<MonthlyChallenge | null> {
    const { data, error } = await this.supabase
      .from('monthly_challenges')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get active challenge: ${error.message}`);
    }
    return data;
  }

  async getChallengeForMonth(month: number, year: number): Promise<MonthlyChallenge | null> {
    const { data, error } = await this.supabase
      .from('monthly_challenges')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get challenge: ${error.message}`);
    }
    return data;
  }

  async setActiveChallenge(challengeId: string): Promise<void> {
    // First, deactivate all challenges
    await this.supabase.from('monthly_challenges').update({ is_active: false }).neq('id', '');

    // Then activate the specified one
    const { error } = await this.supabase
      .from('monthly_challenges')
      .update({ is_active: true })
      .eq('id', challengeId);

    if (error) throw new Error(`Failed to set active challenge: ${error.message}`);
  }

  async createChallenge(input: Omit<MonthlyChallenge, 'id' | 'created_at'>): Promise<MonthlyChallenge> {
    const { data, error } = await this.supabase
      .from('monthly_challenges')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Failed to create challenge: ${error.message}`);
    return data;
  }

  async getCurrentWeekOfMonth(): Promise<number> {
    const now = new Date();
    const dayOfMonth = now.getDate();
    return Math.ceil(dayOfMonth / 7);
  }

  async getChallengeProgress(challengeId: string): Promise<{ week: number; milestone: string }> {
    const week = await this.getCurrentWeekOfMonth();
    const challenge = await this.getActiveChallenge();

    if (!challenge) {
      return { week, milestone: '' };
    }

    const milestone = challenge.weekly_milestones.find((m) => m.week === week);
    return {
      week,
      milestone: milestone ? `${milestone.focus}: ${milestone.goal}` : '',
    };
  }
}
