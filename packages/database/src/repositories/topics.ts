import { getSupabase, Topic } from '../client.js';

export class TopicRepository {
  private supabase = getSupabase();

  async getAvailableTopics(
    categories: string[],
    excludeTopicNames: string[],
    cooldownWeeks: number = 8
  ): Promise<Topic[]> {
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - cooldownWeeks * 7);

    let query = this.supabase
      .from('topics')
      .select('*')
      .in('category', categories);

    if (excludeTopicNames.length > 0) {
      // Filter out excluded topics in JS since Supabase doesn't have NOT IN for arrays easily
    }

    const { data, error } = await query
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(20);

    if (error) throw new Error(`Failed to get topics: ${error.message}`);

    // Filter in JS for more complex conditions
    const filtered = (data || []).filter((topic) => {
      // Exclude specific topic names
      if (excludeTopicNames.includes(topic.topic_name)) return false;

      // Check cooldown
      if (topic.last_used_at) {
        const lastUsed = new Date(topic.last_used_at);
        if (lastUsed > cooldownDate) return false;
      }

      return true;
    });

    return filtered;
  }

  async getTopicsByCategory(category: string): Promise<Topic[]> {
    const { data, error } = await this.supabase
      .from('topics')
      .select('*')
      .eq('category', category)
      .order('last_used_at', { ascending: true, nullsFirst: true });

    if (error) throw new Error(`Failed to get topics: ${error.message}`);
    return data || [];
  }

  async markTopicUsed(topicId: string, issueId: string, authorId: string): Promise<void> {
    const supabase = this.supabase;

    // Update topic's last_used_at and usage_count
    const { error: updateError } = await supabase
      .from('topics')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: supabase.rpc('increment_usage_count', { topic_id: topicId }),
      })
      .eq('id', topicId);

    // Record usage
    const { error: usageError } = await supabase.from('topic_usage').insert({
      topic_id: topicId,
      issue_id: issueId,
      author_id: authorId,
    });

    if (updateError) {
      // Fallback: just update last_used_at without increment
      await supabase
        .from('topics')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', topicId);
    }

    if (usageError && !usageError.message.includes('duplicate')) {
      throw new Error(`Failed to record topic usage: ${usageError.message}`);
    }
  }

  async getRecentlyUsedTopics(weeks: number = 8): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

    const { data, error } = await this.supabase
      .from('topics')
      .select('topic_name')
      .gte('last_used_at', cutoffDate.toISOString());

    if (error) throw new Error(`Failed to get recent topics: ${error.message}`);
    return (data || []).map((t) => t.topic_name);
  }

  async getAllTopics(): Promise<Topic[]> {
    const { data, error } = await this.supabase
      .from('topics')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw new Error(`Failed to get topics: ${error.message}`);
    return data || [];
  }
}
