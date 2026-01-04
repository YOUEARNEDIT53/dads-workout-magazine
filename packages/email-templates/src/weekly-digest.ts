export interface DigestEmailData {
  issueNumber: number;
  issueDate: string;
  issueTitle: string;
  editorsLetter: string;
  mainArticles: Array<{
    title: string;
    authorName: string;
    authorTitle: string;
    excerpt: string;
    url: string;
  }>;
  wildcardColumn: {
    title: string;
    authorName: string;
    excerpt: string;
    url: string;
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
  webUrl: string;
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
      (article) => `
    <div class="article-card">
      <h3>${escapeHtml(article.title)}</h3>
      <p class="author-line">By ${escapeHtml(article.authorName)}, ${escapeHtml(article.authorTitle)}</p>
      <p>${escapeHtml(article.excerpt)}</p>
      <a href="${escapeHtml(article.url)}" class="btn">Read Full Article</a>
    </div>
  `
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
    <!-- Header -->
    <div class="header">
      <h1>Dad's Workout Health Magazine</h1>
      <p class="issue-info">Issue #${data.issueNumber} | ${escapeHtml(data.issueDate)}</p>
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
        <h3>${escapeHtml(data.wildcardColumn.title)}</h3>
        <p class="author-line">By ${escapeHtml(data.wildcardColumn.authorName)}</p>
        <p>${escapeHtml(data.wildcardColumn.excerpt)}</p>
        <a href="${escapeHtml(data.wildcardColumn.url)}" class="btn">Read More</a>
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
      <div style="margin-bottom: 20px;">
        ${data.pdfUrl ? `<a href="${escapeHtml(data.pdfUrl)}" class="btn" style="margin-right: 10px;">Download PDF</a>` : ''}
        <a href="${escapeHtml(data.webUrl)}" class="btn btn-secondary">View on Web</a>
      </div>
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
* ${a.title}
  By ${a.authorName}, ${a.authorTitle}
  ${a.excerpt}
  Read more: ${a.url}
`
    )
    .join('\n');

  const quickWinsList = data.quickWins
    .map((qw, i) => `${i + 1}. ${qw.title}: ${qw.content}`)
    .join('\n');

  const qaList = data.readerQA.map((qa) => `Q: ${qa.question}\nA: ${qa.answer} - ${qa.expert}`).join('\n\n');

  return `
DAD'S WORKOUT HEALTH MAGAZINE
Issue #${data.issueNumber} | ${data.issueDate}

${data.issueTitle}

FROM THE EDITOR'S DESK
${data.editorsLetter}

---

THIS WEEK'S FEATURES
${articlesList}

---

GUEST COLUMN
${data.wildcardColumn.title}
By ${data.wildcardColumn.authorName}
${data.wildcardColumn.excerpt}
Read more: ${data.wildcardColumn.url}

---

QUICK WINS
${quickWinsList}

---

GEAR CORNER
${data.gearCorner.productName} - ${data.gearCorner.price}
${data.gearCorner.description}
Pros: ${data.gearCorner.pros.join(', ')}
Cons: ${data.gearCorner.cons.join(', ')}

---

READER Q&A
${qaList}

---

MONTHLY CHALLENGE UPDATE
${data.challengeUpdate.title} - Week ${data.challengeUpdate.week}
${data.challengeUpdate.content}

---

${data.pdfUrl ? `Download PDF: ${data.pdfUrl}` : ''}
View on Web: ${data.webUrl}

Unsubscribe: ${data.unsubscribeUrl}

Dad's Workout Health Magazine
Helping dads get stronger, one week at a time.
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
