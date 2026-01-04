// GitHub raw content base URL for images
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/YOUEARNEDIT53/dads-workout-magazine/main/assets/images';

// Author ID to image filename mapping
const AUTHOR_IMAGES: Record<string, string> = {
  'dr-marcus-chen': `${IMAGE_BASE_URL}/dr-marcus-chen.png`,
  'dr-angela-okafor': `${IMAGE_BASE_URL}/dr-angela-okafor.png`,
  'coach-dt-thompson': `${IMAGE_BASE_URL}/coach-dt-thompson.png`,
  'maya-santana': `${IMAGE_BASE_URL}/maya-santana.png`,
  'gary-sunglass-hut': `${IMAGE_BASE_URL}/gary-sunglass-hut.png`,
};

const COVER_IMAGE = `${IMAGE_BASE_URL}/cover.png`;

export interface DigestEmailData {
  issueNumber: number;
  issueDate: string;
  issueTitle: string;
  editorsLetter: string;
  mainArticles: Array<{
    title: string;
    authorId: string;
    authorName: string;
    authorTitle: string;
    content: string;
    excerpt: string;
  }>;
  wildcardColumn: {
    title: string;
    authorId: string;
    authorName: string;
    content: string;
    excerpt: string;
  };
  quickWins: Array<{
    title: string;
    content: string;
    category: string;
  }>;
  gearCorner: {
    productName: string;
    description: string;
    price: string;
    pros: string[];
    cons: string[];
  };
  readerQA: Array<{
    question: string;
    answer: string;
    expert: string;
  }>;
  challengeUpdate: {
    title: string;
    week: number;
    content: string;
  };
  pdfUrl?: string;
  unsubscribeUrl: string;
}

export function generateDigestEmailHtml(data: DigestEmailData): string {
  const styles = `
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a365d; color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header .issue-info { margin-top: 10px; font-size: 14px; opacity: 0.9; }
    .section { padding: 25px 30px; }
    .section-alt { background-color: #f8fafc; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 0; }
    h2 { color: #1a365d; font-size: 22px; margin: 0 0 15px 0; font-weight: 600; }
    h3 { color: #2d3748; font-size: 18px; margin: 0 0 10px 0; font-weight: 600; }
    h4 { color: #4a5568; font-size: 16px; margin: 0 0 8px 0; font-weight: 600; }
    p { color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0; }
    .article-card { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .author-line { color: #718096; font-size: 14px; margin-bottom: 12px; font-style: italic; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .btn-secondary { background-color: #64748b; }
    .quick-win { display: flex; margin-bottom: 15px; }
    .quick-win-number { background-color: #2563eb; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 15px; flex-shrink: 0; }
    .category-tag { display: inline-block; background-color: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase; margin-top: 8px; }
    .gear-section { background-color: #fef3c7; border-radius: 8px; padding: 20px; }
    .price-tag { color: #047857; font-weight: 700; font-size: 18px; margin-bottom: 15px; }
    .pros-cons { display: flex; gap: 20px; margin-top: 15px; }
    .pros-cons-col { flex: 1; }
    .pros-cons-header { font-weight: 600; margin-bottom: 8px; }
    .pro-item { color: #047857; font-size: 14px; margin-bottom: 4px; }
    .con-item { color: #dc2626; font-size: 14px; margin-bottom: 4px; }
    .qa-card { border-left: 4px solid #2563eb; padding-left: 20px; margin-bottom: 20px; }
    .question { font-weight: 600; color: #1a365d; margin-bottom: 10px; }
    .answer { color: #4a5568; margin-bottom: 8px; }
    .expert-line { color: #718096; font-size: 14px; font-style: italic; }
    .challenge-section { background-color: #ecfdf5; border-radius: 8px; padding: 20px; }
    .week-badge { display: inline-block; background-color: #047857; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
    .footer { background-color: #1e293b; color: #94a3b8; padding: 30px; text-align: center; }
    .footer-links { margin-top: 20px; }
    .footer-links a { color: #94a3b8; text-decoration: underline; font-size: 14px; }
    .wildcard-section { background-color: #fdf4ff; border-radius: 8px; padding: 20px; }
  `;

  const articleCardsHtml = data.mainArticles
    .map(
      (article) => {
        const authorImage = AUTHOR_IMAGES[article.authorId] || '';
        return `
    <div class="article-card" style="margin-bottom: 30px;">
      <h3 style="color: #1a365d; font-size: 24px; margin-bottom: 15px;">${escapeHtml(article.title)}</h3>
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
        ${authorImage ? `<img src="${authorImage}" alt="${escapeHtml(article.authorName)}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 3px solid #2563eb;" />` : ''}
        <div>
          <p style="margin: 0; font-weight: 600; color: #1a365d; font-size: 16px;">${escapeHtml(article.authorName)}</p>
          <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px; font-style: italic;">${escapeHtml(article.authorTitle)}</p>
        </div>
      </div>
      <div style="white-space: pre-wrap; line-height: 1.7; color: #374151;">${escapeHtml(article.content)}</div>
    </div>
  `;
      }
    )
    .join('');

  const quickWinsHtml = data.quickWins
    .map(
      (win, i) => `
    <div class="quick-win">
      <div class="quick-win-number">${i + 1}</div>
      <div>
        <h4>${escapeHtml(win.title)}</h4>
        <p style="margin-bottom: 0;">${escapeHtml(win.content)}</p>
        <span class="category-tag">${escapeHtml(win.category)}</span>
      </div>
    </div>
  `
    )
    .join('');

  const readerQAHtml = data.readerQA
    .map(
      (qa) => `
    <div class="qa-card">
      <p class="question">Q: ${escapeHtml(qa.question)}</p>
      <p class="answer">${escapeHtml(qa.answer)}</p>
      <p class="expert-line">- ${escapeHtml(qa.expert)}</p>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dad's Workout - Issue #${data.issueNumber}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <!-- Header with Cover Image -->
    <div class="header" style="padding: 0;">
      <img src="${COVER_IMAGE}" alt="Dad's Workout Health Magazine" style="width: 100%; max-width: 600px; display: block;" />
      <div style="padding: 15px 20px; background-color: #1a365d;">
        <p class="issue-info" style="margin: 0;">Issue #${data.issueNumber} | ${escapeHtml(data.issueDate)}</p>
      </div>
    </div>

    <!-- Editor's Letter -->
    <div class="section">
      <h2>${escapeHtml(data.issueTitle)}</h2>
      <h3>From the Editor's Desk</h3>
      <p>${escapeHtml(data.editorsLetter)}</p>
    </div>

    <hr class="divider">

    <!-- Main Articles -->
    <div class="section">
      <h2>This Week's Features</h2>
      ${articleCardsHtml}
    </div>

    <hr class="divider">

    <!-- Wildcard Column -->
    <div class="section section-alt">
      <h2>Guest Column</h2>
      <div class="wildcard-section">
        <h3 style="color: #7c3aed; font-size: 22px; margin-bottom: 15px;">${escapeHtml(data.wildcardColumn.title)}</h3>
        <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
          ${AUTHOR_IMAGES[data.wildcardColumn.authorId] ? `<img src="${AUTHOR_IMAGES[data.wildcardColumn.authorId]}" alt="${escapeHtml(data.wildcardColumn.authorName)}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 3px solid #7c3aed;" />` : ''}
          <div>
            <p style="margin: 0; font-weight: 600; color: #7c3aed; font-size: 16px;">${escapeHtml(data.wildcardColumn.authorName)}</p>
            <p style="margin: 4px 0 0 0; color: #718096; font-size: 13px; font-style: italic;">Guest Columnist</p>
          </div>
        </div>
        <div style="white-space: pre-wrap; line-height: 1.7; color: #374151;">${escapeHtml(data.wildcardColumn.content)}</div>
      </div>
    </div>

    <hr class="divider">

    <!-- Quick Wins -->
    <div class="section">
      <h2>Quick Wins</h2>
      <p style="color: #718096; margin-bottom: 20px;">3 things you can do today</p>
      ${quickWinsHtml}
    </div>

    <hr class="divider">

    <!-- Gear Corner -->
    <div class="section section-alt">
      <h2>Gear Corner</h2>
      <div class="gear-section">
        <h3>${escapeHtml(data.gearCorner.productName)}</h3>
        <p class="price-tag">${escapeHtml(data.gearCorner.price)}</p>
        <p>${escapeHtml(data.gearCorner.description)}</p>
        <div class="pros-cons">
          <div class="pros-cons-col">
            <p class="pros-cons-header">Pros</p>
            ${data.gearCorner.pros.map((pro) => `<p class="pro-item">+ ${escapeHtml(pro)}</p>`).join('')}
          </div>
          <div class="pros-cons-col">
            <p class="pros-cons-header">Cons</p>
            ${data.gearCorner.cons.map((con) => `<p class="con-item">- ${escapeHtml(con)}</p>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <hr class="divider">

    <!-- Reader Q&A -->
    <div class="section">
      <h2>Reader Q&A</h2>
      ${readerQAHtml}
    </div>

    <hr class="divider">

    <!-- Monthly Challenge -->
    <div class="section section-alt">
      <h2>Monthly Challenge Update</h2>
      <div class="challenge-section">
        <h3>${escapeHtml(data.challengeUpdate.title)}</h3>
        <span class="week-badge">Week ${data.challengeUpdate.week}</span>
        <p>${escapeHtml(data.challengeUpdate.content)}</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${data.pdfUrl ? `<div style="margin-bottom: 20px;"><a href="${escapeHtml(data.pdfUrl)}" class="btn">Download PDF</a></div>` : ''}
      <p>Dad's Workout Health Magazine<br>Helping dads get stronger, one week at a time.</p>
      <div class="footer-links">
        <a href="${escapeHtml(data.unsubscribeUrl)}">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateDigestEmailText(data: DigestEmailData): string {
  const articlesList = data.mainArticles
    .map(
      (a) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${a.title}
By ${a.authorName}, ${a.authorTitle}

${a.content}
`
    )
    .join('\n');

  const quickWinsList = data.quickWins
    .map((qw, i) => `${i + 1}. ${qw.title}: ${qw.content}`)
    .join('\n');

  const qaList = data.readerQA.map((qa) => `Q: ${qa.question}\nA: ${qa.answer} - ${qa.expert}`).join('\n\n');

  return `
═══════════════════════════════════════════════════════════════
   DAD'S WORKOUT HEALTH MAGAZINE
   Issue #${data.issueNumber} | ${data.issueDate}
═══════════════════════════════════════════════════════════════

${data.issueTitle}

FROM THE EDITOR'S DESK
─────────────────────────────────────────────────────────────────
${data.editorsLetter}

THIS WEEK'S FEATURES
${articlesList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GUEST COLUMN
${data.wildcardColumn.title}
By ${data.wildcardColumn.authorName}

${data.wildcardColumn.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK WINS - 3 Things You Can Do Today
─────────────────────────────────────────────────────────────────
${quickWinsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GEAR CORNER
─────────────────────────────────────────────────────────────────
${data.gearCorner.productName} - ${data.gearCorner.price}
${data.gearCorner.description}
Pros: ${data.gearCorner.pros.join(', ')}
Cons: ${data.gearCorner.cons.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READER Q&A
─────────────────────────────────────────────────────────────────
${qaList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MONTHLY CHALLENGE UPDATE
─────────────────────────────────────────────────────────────────
${data.challengeUpdate.title} - Week ${data.challengeUpdate.week}
${data.challengeUpdate.content}

═══════════════════════════════════════════════════════════════
${data.pdfUrl ? `Download PDF: ${data.pdfUrl}\n` : ''}
Unsubscribe: ${data.unsubscribeUrl}

Dad's Workout Health Magazine
Helping dads get stronger, one week at a time.
═══════════════════════════════════════════════════════════════
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
