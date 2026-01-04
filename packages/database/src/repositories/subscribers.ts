import { getSupabase, Subscriber } from '../client.js';

export class SubscriberRepository {
  private supabase = getSupabase();

  async getActiveSubscribers(): Promise<Subscriber[]> {
    const { data, error } = await this.supabase
      .from('subscribers')
      .select('*')
      .eq('status', 'active')
      .order('subscribed_at', { ascending: true });

    if (error) throw new Error(`Failed to get subscribers: ${error.message}`);
    return data || [];
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | null> {
    const { data, error } = await this.supabase
      .from('subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get subscriber: ${error.message}`);
    }
    return data;
  }

  async addSubscriber(email: string, name?: string): Promise<Subscriber> {
    const { data, error } = await this.supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase(),
        name,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add subscriber: ${error.message}`);
    return data;
  }

  async unsubscribe(email: string): Promise<void> {
    const { error } = await this.supabase
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase());

    if (error) throw new Error(`Failed to unsubscribe: ${error.message}`);
  }

  async markBounced(email: string): Promise<void> {
    const { error } = await this.supabase
      .from('subscribers')
      .update({ status: 'bounced' })
      .eq('email', email.toLowerCase());

    if (error) throw new Error(`Failed to mark bounced: ${error.message}`);
  }

  async getSubscriberCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw new Error(`Failed to count subscribers: ${error.message}`);
    return count || 0;
  }
}
