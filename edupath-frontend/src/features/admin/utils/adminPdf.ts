import jsPDF from 'jspdf';

// ─── Colour palette (light-mode, cyan accents) ────────────────────────────────
const C = {
  white:       [255, 255, 255] as [number, number, number],
  pageBg:      [255, 255, 255] as [number, number, number], // white
  cyanBg:      [22,  189, 175] as [number, number, number], // teal-500  (header bar)
  cyanLight:   [204, 251, 241] as [number, number, number], // teal-100  (section bg)
  cyanBorder:  [94,  234, 212] as [number, number, number], // teal-300
  textDark:    [15,  23,  42]  as [number, number, number], // slate-900
  textMid:     [71,  85,  105] as [number, number, number], // slate-600
  textLight:   [148, 163, 184] as [number, number, number], // slate-400
  rowAlt:      [241, 245, 249] as [number, number, number], // slate-100
  green:       [22,  163, 74]  as [number, number, number],
  red:         [220, 38,  38]  as [number, number, number],
  amber:       [217, 119, 6]   as [number, number, number],
};

const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 14;
const COL_W   = PAGE_W - MARGIN * 2;
const FOOTER_H = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initPdf() {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
}

function addPageBackground(pdf: jsPDF) {
  pdf.setFillColor(...C.pageBg);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

function addHeader(pdf: jsPDF, title: string, subtitle: string) {
  // Top thin accent bar (3mm high) in cyanBg
  pdf.setFillColor(...C.cyanBg);
  pdf.rect(0, 0, PAGE_W, 3, 'F');

  // EduPath logo text
  pdf.setFontSize(11);
  pdf.setTextColor(...C.cyanBg);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EduPath Admin', MARGIN, 11);

  // Title
  pdf.setFontSize(15);
  pdf.setTextColor(...C.textDark);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGIN, 18);

  // Date right-aligned
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.textMid);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, PAGE_W - MARGIN, 18, { align: 'right' });

  // Subtitle
  pdf.setFontSize(9.5);
  pdf.setTextColor(...C.textMid);
  pdf.text(subtitle, MARGIN, 24);

  // A thin cyan line under header
  pdf.setDrawColor(...C.cyanBorder);
  pdf.setLineWidth(0.35);
  pdf.line(MARGIN, 27, PAGE_W - MARGIN, 27);
}

function addFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - 6;
  pdf.setDrawColor(...C.cyanBorder);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2);
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textLight);
  pdf.text('EduPath Admin — Confidential', MARGIN, y);
  pdf.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, y, { align: 'right' });
}

function sectionHeading(pdf: jsPDF, label: string, y: number): number {
  pdf.setFillColor(...C.cyanLight);
  pdf.setDrawColor(...C.cyanBorder);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN, y, COL_W, 7, 1, 1, 'FD');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.cyanBg);
  pdf.text(label.toUpperCase(), MARGIN + 3, y + 4.8);
  return y + 10;
}

type TableRow = (string | number | null | undefined)[];

function drawTable(
  pdf: jsPDF,
  headers: string[],
  rows: TableRow[],
  startY: number,
  colWidths?: number[],
): number {
  const widths = colWidths ?? headers.map(() => COL_W / headers.length);
  let y = startY;

  const checkNewPage = (needed: number) => {
    if (y + needed > PAGE_H - FOOTER_H - 4) {
      pdf.addPage();
      addPageBackground(pdf);
      y = 32;
    }
  };

  // Header row
  checkNewPage(7);
  let x = MARGIN;
  pdf.setFillColor(...C.cyanBg);
  pdf.rect(MARGIN, y, COL_W, 6.5, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.white);
  headers.forEach((h, i) => {
    pdf.text(h, x + 2, y + 4.5, { maxWidth: widths[i] - 3 });
    x += widths[i];
  });
  y += 6.5;

  // Data rows
  rows.forEach((row, ri) => {
    const cellTexts = row.map((v, i) =>
      pdf.splitTextToSize(String(v ?? '—'), widths[i] - 3)
    );
    const rowH = Math.max(...cellTexts.map(t => t.length)) * 4 + 3;
    checkNewPage(rowH);

    if (ri % 2 === 0) {
      pdf.setFillColor(...C.rowAlt);
      pdf.rect(MARGIN, y, COL_W, rowH, 'F');
    }
    pdf.setDrawColor(...C.cyanBorder);
    pdf.setLineWidth(0.15);
    pdf.rect(MARGIN, y, COL_W, rowH);

    x = MARGIN;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.textDark);
    cellTexts.forEach((lines, i) => {
      pdf.text(lines, x + 2, y + 3.5);
      x += widths[i];
    });
    y += rowH;
  });

  return y + 3;
}

function statBox(pdf: jsPDF, label: string, value: string | number, x: number, y: number, w: number) {
  pdf.setFillColor(...C.white);
  pdf.setDrawColor(...C.cyanBorder);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, w, 18, 2, 2, 'FD');
  // Cyan top accent line
  pdf.setFillColor(...C.cyanBg);
  pdf.roundedRect(x, y, w, 3, 2, 2, 'F');
  pdf.rect(x, y + 1.5, w, 1.5, 'F'); // flatten bottom of top accent

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.cyanBg);
  pdf.text(String(value), x + w / 2, y + 11, { align: 'center' });

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.textMid);
  pdf.text(label, x + w / 2, y + 15.5, { align: 'center' });
}

// ─── Page builders ────────────────────────────────────────────────────────────

export function downloadDashboardPdf(data: {
  stats: { total_students: number; verified_associates: number; open_reports: number; pending_applications: number } | null;
  studentPosts: { title: string; author: string; hub: string; upvotes: number; created_at: string }[];
  associatePosts: { associate: string; associate_type: string; hub: string; upvotes: number; content: string }[];
  hubHealth: { name: string; student_posts_7d: number; associate_posts_7d: number; open_reports: number; traffic_light: string }[];
}) {
  const pdf = initPdf();
  addPageBackground(pdf);
  addHeader(pdf, 'Admin Dashboard Report', 'Platform overview — students, associates, hub health');

  let y = 34;

  // Stats
  if (data.stats) {
    const boxW = (COL_W - 9) / 4;
    statBox(pdf, 'Active Students',      data.stats.total_students,       MARGIN,                     y, boxW);
    statBox(pdf, 'Verified Associates',  data.stats.verified_associates,  MARGIN + boxW + 3,          y, boxW);
    statBox(pdf, 'Open Reports',         data.stats.open_reports,         MARGIN + (boxW + 3) * 2,    y, boxW);
    statBox(pdf, 'Pending Applications', data.stats.pending_applications, MARGIN + (boxW + 3) * 3,    y, boxW);
    y += 22;
  }

  // Hub health
  y = sectionHeading(pdf, 'Hub Health', y);
  y = drawTable(pdf,
    ['Hub', 'Student Posts (7d)', 'Associate Posts (7d)', 'Open Reports', 'Status'],
    data.hubHealth.map(h => [h.name, h.student_posts_7d, h.associate_posts_7d, h.open_reports, h.traffic_light.toUpperCase()]),
    y,
    [50, 38, 45, 35, 28],
  );

  // Recent student posts
  y = sectionHeading(pdf, 'Recent Student Posts', y);
  y = drawTable(pdf,
    ['Title', 'Author', 'Hub', 'Upvotes'],
    data.studentPosts.map(p => [p.title, p.author, p.hub, p.upvotes]),
    y,
    [80, 35, 45, 22],
  );

  // Recent associate posts
  y = sectionHeading(pdf, 'Recent Associate Posts', y);
  y = drawTable(pdf,
    ['Associate', 'Type', 'Hub', 'Upvotes', 'Preview'],
    data.associatePosts.map(p => [p.associate, p.associate_type, p.hub, p.upvotes, p.content?.slice(0, 60)]),
    y,
    [38, 22, 38, 18, 66],
  );

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, total);
  }
  pdf.save('edupath-admin-dashboard.pdf');
}

export function downloadUsersPdf(users: {
  email: string; first_name?: string; last_name?: string;
  role: string; is_active?: boolean; is_staff?: boolean; date_joined?: string;
}[]) {
  const pdf = initPdf();
  addPageBackground(pdf);
  addHeader(pdf, 'Users Report', `${users.length} user records`);

  let y = 34;
  y = sectionHeading(pdf, `All Users (${users.length})`, y);
  y = drawTable(pdf,
    ['Email', 'Name', 'Role', 'Active', 'Staff', 'Joined'],
    users.map(u => [
      u.email,
      `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—',
      u.role,
      u.is_active ? 'Yes' : 'No',
      u.is_staff ? 'Yes' : 'No',
      u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—',
    ]),
    y,
    [55, 35, 22, 18, 18, 28],
  );

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) { pdf.setPage(i); addFooter(pdf, i, total); }
  pdf.save('edupath-admin-users.pdf');
}

export function downloadApplicationsPdf(apps: {
  name: string; associate_type: string; hub: string;
  contact_email: string; application_status: string;
  location?: string; created_at: string;
}[]) {
  const pdf = initPdf();
  addPageBackground(pdf);
  addHeader(pdf, 'Associate Applications Report', `${apps.length} applications`);

  let y = 34;
  y = sectionHeading(pdf, `Applications (${apps.length})`, y);
  y = drawTable(pdf,
    ['Name', 'Type', 'Hub', 'Email', 'Status', 'Applied'],
    apps.map(a => [
      a.name,
      a.associate_type,
      a.hub,
      a.contact_email,
      a.application_status,
      new Date(a.created_at).toLocaleDateString(),
    ]),
    y,
    [38, 22, 32, 48, 26, 22],
  );

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) { pdf.setPage(i); addFooter(pdf, i, total); }
  pdf.save('edupath-admin-applications.pdf');
}

export function downloadCoursesPdf(courses: {
  name: string; category: string; institution?: string;
  cutoff_2023?: number | null; avg_fees_ksh?: number | null; related_hub?: string;
}[]) {
  const pdf = initPdf();
  addPageBackground(pdf);
  addHeader(pdf, 'Courses Report', `${courses.length} course records`);

  let y = 34;
  y = sectionHeading(pdf, `Courses (${courses.length})`, y);
  y = drawTable(pdf,
    ['Name', 'Category', 'Institution', 'Cutoff 2023', 'Avg Fees (KSh)', 'Hub'],
    courses.map(c => [
      c.name,
      c.category,
      c.institution ?? '—',
      c.cutoff_2023 ?? '—',
      c.avg_fees_ksh ? c.avg_fees_ksh.toLocaleString() : '—',
      c.related_hub ?? '—',
    ]),
    y,
    [46, 36, 38, 24, 28, 24],
  );

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) { pdf.setPage(i); addFooter(pdf, i, total); }
  pdf.save('edupath-admin-courses.pdf');
}

export function downloadUniversitiesPdf(universities: {
  name: string; short_name: string; type: string;
  location: string; ranking?: number; students?: string; established?: number;
}[]) {
  const pdf = initPdf();
  addPageBackground(pdf);
  addHeader(pdf, 'Universities Report', `${universities.length} universities`);

  let y = 34;
  y = sectionHeading(pdf, `Universities (${universities.length})`, y);
  y = drawTable(pdf,
    ['Name', 'Short', 'Type', 'Location', 'Ranking', 'Students', 'Est.'],
    universities.map(u => [
      u.name, u.short_name, u.type, u.location,
      u.ranking ?? '—', u.students ?? '—', u.established ?? '—',
    ]),
    y,
    [52, 22, 18, 30, 18, 22, 14],
  );

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) { pdf.setPage(i); addFooter(pdf, i, total); }
  pdf.save('edupath-admin-universities.pdf');
}

export function downloadModerationPdf(data: {
  hubName: string;
  studentPosts: { title: string; author: string; upvotes: number; created_at: string }[];
  associatePosts: { associate: string; associate_type: string; upvotes: number; report_count: number; is_visible: boolean }[];
  reports: { post_content: string; associate: string; report_count: number }[];
}) {
  const pdf = initPdf();
  addPageBackground(pdf);
  addHeader(pdf, `Hub Moderation — ${data.hubName}`, 'Student posts, associate posts, open reports');

  let y = 34;

  y = sectionHeading(pdf, `Student Posts (${data.studentPosts.length})`, y);
  y = drawTable(pdf,
    ['Title', 'Author', 'Upvotes', 'Date'],
    data.studentPosts.map(p => [p.title, p.author, p.upvotes, new Date(p.created_at).toLocaleDateString()]),
    y,
    [90, 40, 22, 30],
  );

  y = sectionHeading(pdf, `Associate Posts (${data.associatePosts.length})`, y);
  y = drawTable(pdf,
    ['Associate', 'Type', 'Upvotes', 'Reports', 'Visible'],
    data.associatePosts.map(p => [p.associate, p.associate_type, p.upvotes, p.report_count, p.is_visible ? 'Yes' : 'No']),
    y,
    [60, 26, 22, 22, 22],
  );

  y = sectionHeading(pdf, `Open Reports (${data.reports.length})`, y);
  y = drawTable(pdf,
    ['Post Preview', 'Associate', 'Reports'],
    data.reports.map(r => [r.post_content?.slice(0, 80), r.associate, r.report_count]),
    y,
    [110, 50, 22],
  );

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) { pdf.setPage(i); addFooter(pdf, i, total); }
  pdf.save(`edupath-admin-moderation-${data.hubName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
