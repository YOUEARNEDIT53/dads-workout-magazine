import { getSupabase, Issue, Article, QuickWin, ReaderQA, GearCorner } from '../client.js';

export interface CreateIssueInput {
  issue_number: number;
  week_number: number;
  year: number;
  title: string;
  slug: string;
  editors_letter: string;
  gear_corner: GearCorner;
  challenge_update?: string;
}

export interface CreateArticleInput {
  issue_id: string;
  author_id: string;
  author_name: string;
  author_title?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  word_count: number;
  article_type: 'main_column' | 'wildcard' | 'guest';
  position: number;
  topics?: string[];
}

export interface CreateQuickWinInput {
  issue_id: string;
  title: string;
  content: string;
  category: 'workout' | 'nutrition' | 'mindset' | 'recovery' | 'lifestyle';
  position: number;
}

export interface CreateReaderQAInput {
  issue_id: string;
  question: string;
  answer: string;
  answering_expert?: string;
  position: number;
}

export class IssueRepository {
  private supabase = getSupabase();

  async getNextIssueNumber(): Promise<number> {
    const { data } = await this.supabase
      .from('issues')
      .select('issue_number')
      .order('issue_number', { ascending: false })
      .limit(1)
      .single();

    return data ? data.issue_number + 1 : 1;
  }

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const { data, error } = await this.supabase
      .from('issues')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Failed to create issue: ${error.message}`);
    return data;
  }

  async getIssue(id: string): Promise<Issue | null> {
    const { data, error } = await this.supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get issue: ${error.message}`);
    }
    return data;
  }

  async getIssueBySlug(slug: string): Promise<Issue | null> {
    const { data, error } = await this.supabase
      .from('issues')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get issue: ${error.message}`);
    }
    return data;
  }

  async getPublishedIssues(limit = 10): Promise<Issue[]> {
    const { data, error } = await this.supabase
      .from('issues')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get issues: ${error.message}`);
    return data || [];
  }

  async updateIssueStatus(
    id: string,
    status: Issue['status'],
    additionalFields?: Partial<Issue>
  ): Promise<Issue> {
    const updates: Partial<Issue> = { status, ...additionalFields };

    if (status === 'published' && !additionalFields?.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update issue: ${error.message}`);
    return data;
  }

  async markEmailSent(id: string, recipientCount: number): Promise<void> {
    const { error } = await this.supabase
      .from('issues')
      .update({
        email_sent_at: new Date().toISOString(),
        email_recipient_count: recipientCount,
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark email sent: ${error.message}`);
  }

  async updatePdfUrl(id: string, pdfUrl: string): Promise<void> {
    const { error } = await this.supabase
      .from('issues')
      .update({ pdf_url: pdfUrl })
      .eq('id', id);

    if (error) throw new Error(`Failed to update PDF URL: ${error.message}`);
  }
}

export class ArticleRepository {
  private supabase = getSupabase();

  async createArticle(input: CreateArticleInput): Promise<Article> {
    const { data, error } = await this.supabase
      .from('articles')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Failed to create article: ${error.message}`);
    return data;
  }

  async getArticlesForIssue(issueId: string): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('issue_id', issueId)
      .order('position', { ascending: true });

    if (error) throw new Error(`Failed to get articles: ${error.message}`);
    return data || [];
  }

  async getRecentArticlesByAuthor(authorId: string, limit = 5): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get articles: ${error.message}`);
    return data || [];
  }
}

export class QuickWinRepository {
  private supabase = getSupabase();

  async createQuickWin(input: CreateQuickWinInput): Promise<QuickWin> {
    const { data, error } = await this.supabase
      .from('quick_wins')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Failed to create quick win: ${error.message}`);
    return data;
  }

  async getQuickWinsForIssue(issueId: string): Promise<QuickWin[]> {
    const { data, error } = await this.supabase
      .from('quick_wins')
      .select('*')
      .eq('issue_id', issueId)
      .order('position', { ascending: true });

    if (error) throw new Error(`Failed to get quick wins: ${error.message}`);
    return data || [];
  }
}

export class ReaderQARepository {
  private supabase = getSupabase();

  async createReaderQA(input: CreateReaderQAInput): Promise<ReaderQA> {
    const { data, error } = await this.supabase
      .from('reader_qa')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Failed to create Q&A: ${error.message}`);
    return data;
  }

  async getReaderQAForIssue(issueId: string): Promise<ReaderQA[]> {
    const { data, error } = await this.supabase
      .from('reader_qa')
      .select('*')
      .eq('issue_id', issueId)
      .order('position', { ascending: true });

    if (error) throw new Error(`Failed to get Q&A: ${error.message}`);
    return data || [];
  }
}
