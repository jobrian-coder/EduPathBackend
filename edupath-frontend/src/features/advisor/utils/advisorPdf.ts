import jsPDF from 'jspdf';
import type { AdvisorRecommendation } from '../../../services/api';
import type { ChatMessage, SuggestedHub } from '../context/AdvisorSessionContext';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  teal:      [13,  148, 136] as [number,number,number],  // teal-600
  tealMid:   [20,  184, 166] as [number,number,number],  // teal-500
  tealLight: [153, 246, 228] as [number,number,number],  // teal-200
  tealBg:    [240, 253, 250] as [number,number,number],  // teal-50
  tealBd:    [94,  234, 212] as [number,number,number],  // teal-300
  white:     [255, 255, 255] as [number,number,number],
  pageBg:    [252, 253, 254] as [number,number,number],
  dark:      [15,  23,  42]  as [number,number,number],  // slate-900
  mid:       [71,  85,  105] as [number,number,number],  // slate-600
  light:     [148, 163, 184] as [number,number,number],  // slate-400
  rowAlt:    [248, 250, 252] as [number,number,number],  // slate-50
  green:     [22,  163, 74]  as [number,number,number],
  greenBg:   [220, 252, 231] as [number,number,number],
  amber:     [180, 83,  9]   as [number,number,number],
  amberBg:   [254, 243, 199] as [number,number,number],
  red:       [185, 28,  28]  as [number,number,number],
  redBg:     [254, 226, 226] as [number,number,number],
  userBg:    [204, 251, 241] as [number,number,number],  // teal-100
  aiBg:      [241, 245, 249] as [number,number,number],  // slate-100
};

const PAGE_W  = 210;
const PAGE_H  = 297;
const M       = 14;
const CW      = PAGE_W - M * 2;
const FOOT_H  = 14;

// ── Shared helpers ────────────────────────────────────────────────────────────

function newPdf() {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
}

function bgPage(pdf: jsPDF) {
  pdf.setFillColor(...C.pageBg);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

/**
 * Draw the branded header. Returns the Y position to start content from.
 */
function drawHeader(pdf: jsPDF, title: string, subtitle: string): number {
  // Deep teal band (full width, 20mm)
  pdf.setFillColor(...C.teal);
  pdf.rect(0, 0, PAGE_W, 20, 'F');

  // Lighter teal lower-half gradient overlay
  pdf.setFillColor(...C.tealMid);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.35 }));
  pdf.rect(0, 10, PAGE_W, 10, 'F');
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // "EduPath" wordmark  
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.white);
  pdf.text('EduPath', M, 9);

  // Tagline
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.tealLight);
  pdf.text('Your Personal Career Guide', M, 14);

  // Website right-aligned
  pdf.setFontSize(7.5);
  pdf.setTextColor(...C.tealLight);
  pdf.text('edupath.app', PAGE_W - M, 9, { align: 'right' });

  // Date
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.tealLight);
  pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), PAGE_W - M, 14, { align: 'right' });

  // Title block
  pdf.setFontSize(17);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.dark);
  pdf.text(title, M, 31);

  // Subtitle
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.mid);
  pdf.text(subtitle, M, 37);

  // Teal rule under header block
  pdf.setDrawColor(...C.tealBd);
  pdf.setLineWidth(0.5);
  pdf.line(M, 41, PAGE_W - M, 41);

  return 47;
}

/**
 * Draw a teal-accented section label.
 */
function sectionLabel(pdf: jsPDF, label: string, y: number): number {
  pdf.setFillColor(...C.tealBg);
  pdf.setDrawColor(...C.tealBd);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(M, y, CW, 7, 1, 1, 'FD');

  // Left teal accent strip
  pdf.setFillColor(...C.tealMid);
  pdf.rect(M, y, 3, 7, 'F');

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.teal);
  pdf.text(label.toUpperCase(), M + 6, y + 4.8);
  return y + 11;
}

/**
 * Draw page footer (call on every page at the end).
 */
function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const y = PAGE_H - FOOT_H;

  // Footer band
  pdf.setFillColor(...C.rowAlt);
  pdf.rect(0, y, PAGE_W, FOOT_H, 'F');

  // Top border of footer
  pdf.setDrawColor(...C.tealBd);
  pdf.setLineWidth(0.3);
  pdf.line(M, y, PAGE_W - M, y);

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');

  // Left: brand
  pdf.setTextColor(...C.teal);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EduPath', M, y + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.mid);
  pdf.text(' — Empowering Your Academic Journey', M + 16, y + 5.5);

  // Centre: page
  pdf.setTextColor(...C.light);
  pdf.text(`Page ${pageNum} of ${totalPages}`, PAGE_W / 2, y + 5.5, { align: 'center' });

  // Right: confidential
  pdf.setTextColor(...C.light);
  pdf.text('Personal & Confidential', PAGE_W - M, y + 5.5, { align: 'right' });

  // Bottom teal strip
  pdf.setFillColor(...C.tealMid);
  pdf.rect(0, PAGE_H - 2, PAGE_W, 2, 'F');
}

/**
 * Continuation-page mini header (thin teal bar + page number).
 */
function contPageTop(pdf: jsPDF) {
  bgPage(pdf);
  pdf.setFillColor(...C.teal);
  pdf.rect(0, 0, PAGE_W, 4, 'F');
}

function checkY(pdf: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - FOOT_H - 6) {
    pdf.addPage();
    contPageTop(pdf);
    return 12;
  }
  return y;
}

// ── Match score helpers ───────────────────────────────────────────────────────

function scoreColor(score: number): [number,number,number] {
  if (score >= 75) return C.green;
  if (score >= 50) return C.amber;
  return C.red;
}

function scoreBgColor(score: number): [number,number,number] {
  if (score >= 75) return C.greenBg;
  if (score >= 50) return C.amberBg;
  return C.redBg;
}

function drawMatchBar(pdf: jsPDF, score: number, x: number, y: number, barW: number) {
  const barH = 3.5;
  // Background track
  pdf.setFillColor(...C.aiBg);
  pdf.setDrawColor(200, 210, 220);
  pdf.setLineWidth(0.15);
  pdf.roundedRect(x, y, barW, barH, 1, 1, 'FD');

  // Filled portion
  const filled = (score / 100) * barW;
  const col = scoreColor(score);
  pdf.setFillColor(...col);
  pdf.roundedRect(x, y, filled, barH, 1, 1, 'F');
}

// ── Public API ────────────────────────────────────────────────────────────────

export function downloadRecommendationsPdf(
  recommendations: AdvisorRecommendation[],
  suggestedHubs?: SuggestedHub[],
  kcsePoints?: number | null,
) {
  const pdf = newPdf();
  bgPage(pdf);

  const subtitle = kcsePoints
    ? `Top ${recommendations.length} matches · KCSE Mean ${kcsePoints}/84`
    : `Top ${recommendations.length} personalised course matches`;
  let y = drawHeader(pdf, 'Course Recommendations', subtitle);

  recommendations.forEach((rec, idx) => {
    // Calculate card height properly to prevent text overlap
    const detailsCount = [
      rec.hub_category,
      rec.avg_fees_ksh != null,
      rec.cutoff_2023 != null,
      rec.cutoff_2022 != null
    ].filter(Boolean).length;
    
    const expLines = rec.match_explanation
      ? pdf.splitTextToSize(rec.match_explanation, CW - 26).length
      : 0;
    
    // Calculate career paths lines
    const careerLines = rec.career_paths && rec.career_paths.length > 0
      ? pdf.splitTextToSize(rec.career_paths.join('  ·  '), CW - 26).length
      : 0;
    
    // Base height + match score section + details row + careers + explanation + padding
    const cardH = 38 + // Base header section with padding
      (rec.match_score != null ? 14 : 0) + // Match score bar section
      (detailsCount > 0 ? 12 : 0) + // Details row
      (careerLines > 0 ? 8 + careerLines * 4 : 0) + // Career paths
      (expLines > 0 ? 14 + expLines * 4.5 : 0) + // Explanation section with divider
      6; // Bottom padding

    y = checkY(pdf, y, cardH + 6);

    // ── Card background ──
    pdf.setFillColor(...C.white);
    pdf.setDrawColor(...C.tealBd);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(M, y, CW, cardH, 2, 2, 'FD');

    // Left teal accent bar
    pdf.setFillColor(...C.teal);
    pdf.roundedRect(M, y, 3.5, cardH, 2, 2, 'F');
    pdf.rect(M + 1.5, y, 2, cardH, 'F'); // flatten right side of left bar

    // Rank badge
    const rankX = M + 6;
    const rankY = y + 4;
    pdf.setFillColor(...C.teal);
    pdf.roundedRect(rankX, rankY, 9, 6, 1, 1, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.white);
    pdf.text(`#${idx + 1}`, rankX + 4.5, rankY + 4.2, { align: 'center' });

    // Course name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.dark);
    const courseName = pdf.splitTextToSize(rec.course_name, CW - 40);
    pdf.text(courseName, rankX + 12, rankY + 4.5);

    // Institution
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.mid);
    pdf.text(rec.institution || '—', rankX, y + 14.5);

    // Match score pill + bar
    if (rec.match_score != null) {
      const score = rec.match_score;
      const col = scoreColor(score);
      const bgCol = scoreBgColor(score);
      const pillX = PAGE_W - M - 32;
      const pillY = y + 4;

      pdf.setFillColor(...bgCol);
      pdf.setDrawColor(...col);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(pillX, pillY, 30, 7, 1.5, 1.5, 'FD');

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...col);
      pdf.text(`${score}% Match`, pillX + 15, pillY + 4.8, { align: 'center' });

      // Progress bar
      drawMatchBar(pdf, score, rankX, y + 19, CW - 26);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.light);
      pdf.text(`Match strength: ${score}%`, rankX, y + 26);
    }

    let cy = y + (rec.match_score != null ? 30 : 19);

    // Details row
    const details: [string, string][] = [];
    if (rec.hub_category) details.push(['Hub', rec.hub_category]);
    if (rec.avg_fees_ksh != null) {
      details.push(['Avg Fees', `KES ${rec.avg_fees_ksh.toLocaleString()}/yr`]);
    }
    if (rec.cutoff_2023 != null) details.push(['Cutoff 2023', String(rec.cutoff_2023)]);
    if (rec.cutoff_2022 != null) details.push(['Cutoff 2022', String(rec.cutoff_2022)]);

    const colW = CW / Math.max(details.length, 1);
    details.forEach(([label, val], di) => {
      const dx = rankX + di * colW;
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.light);
      pdf.text(label.toUpperCase(), dx, cy);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.dark);
      pdf.text(val, dx, cy + 4.5);
    });
    cy += 10;

    // Career paths
    if (rec.career_paths && rec.career_paths.length > 0) {
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.light);
      pdf.text('CAREERS', rankX, cy);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.mid);
      const pathTxt = rec.career_paths.join('  ·  ');
      const pathLines = pdf.splitTextToSize(pathTxt, CW - 26);
      pdf.text(pathLines, rankX, cy + 4.5);
      cy += 4.5 + pathLines.length * 4;
    }

    // Match explanation
    if (rec.match_explanation) {
      cy += 2;
      pdf.setDrawColor(...C.tealBd);
      pdf.setLineWidth(0.2);
      pdf.line(rankX, cy, PAGE_W - M - 4, cy);
      cy += 4;

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.teal);
      pdf.text('WHY RECOMMENDED', rankX, cy);
      cy += 4;

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.mid);
      const expLines = pdf.splitTextToSize(rec.match_explanation, CW - 26);
      expLines.forEach((line: string) => {
        pdf.text(line, rankX, cy);
        cy += 4.5;
      });
    }

    y = y + cardH + 6;
  });

  // ── Suggested Hubs section ─────────────────────────────────────────────────
  if (suggestedHubs && suggestedHubs.length > 0) {
    y = checkY(pdf, y, 14 + suggestedHubs.length * 10 + 4);
    y = sectionLabel(pdf, `Recommended Communities (${suggestedHubs.length})`, y);

    suggestedHubs.forEach((hub, hi) => {
      y = checkY(pdf, y, 10);
      const isAlt = hi % 2 === 0;
      if (isAlt) {
        pdf.setFillColor(...C.rowAlt);
        pdf.rect(M, y - 1, CW, 10, 'F');
      }
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...C.dark);
      pdf.text(`${hub.icon || ''}  ${hub.name}`, M + 3, y + 4);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.mid);
      pdf.text(`${hub.member_count.toLocaleString()} members · ${hub.category}`, M + 3, y + 8);
      pdf.setDrawColor(...C.tealBd);
      pdf.setLineWidth(0.15);
      pdf.line(M, y + 9, PAGE_W - M, y + 9);
      y += 11;
    });
  }

  // ── Footers ────────────────────────────────────────────────────────────────
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    drawFooter(pdf, i, total);
  }

  pdf.save('edupath-course-recommendations.pdf');
}

// ── Chat transcript PDF ───────────────────────────────────────────────────────

export function downloadChatTranscriptPdf(messages: ChatMessage[]) {
  const pdf = newPdf();
  bgPage(pdf);

  let y = drawHeader(
    pdf,
    'AI Advisor Chat Transcript',
    `${messages.length} messages  ·  Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
  );

  messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const speaker = isUser ? 'You' : 'EduPath AI Advisor';

    const contentLines = pdf.splitTextToSize(msg.content, CW - 16);
    const bubbleH = contentLines.length * 4.5 + 11;

    y = checkY(pdf, y, bubbleH + 5);

    // Separator between messages (skip first)
    if (idx > 0) {
      pdf.setDrawColor(...C.tealBd);
      pdf.setLineWidth(0.1);
      pdf.setLineDashPattern([1, 2], 0);
      pdf.line(M + 10, y - 2, PAGE_W - M - 10, y - 2);
      pdf.setLineDashPattern([], 0);
    }

    const bubbleBg = isUser ? C.userBg : C.aiBg;
    const bubbleBd = isUser ? C.tealBd : ([203, 213, 225] as [number,number,number]);
    const bubbleX  = isUser ? M + 20 : M;
    const bubbleW  = CW - 20;

    // Bubble
    pdf.setFillColor(...bubbleBg);
    pdf.setDrawColor(...bubbleBd);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(bubbleX, y, bubbleW, bubbleH, 2, 2, 'FD');

    // Left-side accent strip (AI only)
    if (!isUser) {
      pdf.setFillColor(...C.tealMid);
      pdf.roundedRect(bubbleX, y, 2.5, bubbleH, 1, 1, 'F');
      pdf.rect(bubbleX + 1, y, 1.5, bubbleH, 'F');
    }

    // Speaker label
    const textX = bubbleX + (isUser ? 4 : 8);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(isUser ? C.teal[0] : C.mid[0], isUser ? C.teal[1] : C.mid[1], isUser ? C.teal[2] : C.mid[2]);
    pdf.text(speaker, textX, y + 5);

    // Timestamp
    if (msg.created_at) {
      const ts = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.light);
      pdf.text(ts, bubbleX + bubbleW - 3, y + 5, { align: 'right' });
    }

    // Message text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.dark);
    contentLines.forEach((line: string, li: number) => {
      pdf.text(line, textX, y + 10 + li * 4.5);
    });

    y += bubbleH + 5;
  });

  // Empty state
  if (messages.length === 0) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.light);
    pdf.text('No messages in this conversation.', PAGE_W / 2, 120, { align: 'center' });
  }

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    drawFooter(pdf, i, total);
  }

  pdf.save('edupath-ai-advisor-chat.pdf');
}
