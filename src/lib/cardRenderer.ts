import { Student } from '../types';
import { drawQrToCanvas } from './qrHelper';

export async function renderStudentCardToCanvas(
  canvas: HTMLCanvasElement,
  student: Student
): Promise<void> {
  const W = 1011;
  const H = 638;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const NAVY = '#0C2D55';
  const GOLD = '#B4873A';
  const DARK = '#14263D';
  const MUTED = '#55657A';
  const LIGHT_BG = '#F8FAFC';
  const BORDER_COLOR = '#CBD5E1';

  // 1. Background Card
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Outer border with gold trim
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // 2. Top Header Ribbon
  ctx.fillStyle = NAVY;
  ctx.fillRect(26, 26, W - 52, 110);

  // Header Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px Cairo, Tajawal, Arial';
  ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية', W / 2, 58);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '500 18px Cairo, Tajawal, Arial';
  ctx.fillText('جمعية أولياء الأطفال المعاقين ذهنيًا – ولاية غرداية', W / 2, 86);

  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 24px Cairo, Tajawal, Arial';
  ctx.fillText('المركز النفسي البيداغوجي دار الإحسان – العطف', W / 2, 118);

  // Gold separator bar
  ctx.fillStyle = GOLD;
  ctx.fillRect(26, 136, W - 52, 6);

  // 3. Official Title Pill
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(W / 2 - 180, 150, 360, 42);
  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(W / 2 - 180, 150, 360, 42);

  ctx.fillStyle = NAVY;
  ctx.font = 'bold 22px Cairo, Tajawal, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('بطاقة انخراط ورعاية تلميذ معتمدة', W / 2, 178);

  // 4. Photo / Logo Box (Right side in RTL)
  const photoX = W - 260;
  const photoY = 210;
  const photoW = 200;
  const photoH = 250;

  ctx.fillStyle = LIGHT_BG;
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Avatar placeholder
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(photoX + 10, photoY + 10, photoW - 20, photoH - 20);
  ctx.fillStyle = MUTED;
  ctx.font = 'bold 72px Cairo, Tajawal, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(student.full_name.charAt(0), photoX + photoW / 2, photoY + photoH / 2 + 25);

  ctx.fillStyle = NAVY;
  ctx.font = '600 16px Cairo, Tajawal, Arial';
  ctx.fillText('صورة التلميذ(ة)', photoX + photoW / 2, photoY + photoH - 20);

  // 5. Student Details Fields (Center area)
  ctx.textAlign = 'right';
  const labelX = photoX - 25;
  let currentY = 230;

  const c = ctx;
  function drawField(label: string, value: string, isBig = false) {
    c.fillStyle = MUTED;
    c.font = '600 18px Cairo, Tajawal, Arial';
    c.fillText(label, labelX, currentY);

    c.fillStyle = isBig ? NAVY : DARK;
    c.font = isBig ? 'bold 26px Cairo, Tajawal, Arial' : 'bold 20px Cairo, Tajawal, Arial';
    c.fillText(value, labelX - 160, currentY);

    // Subtle line below
    c.strokeStyle = '#E2E8F0';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(labelX - 420, currentY + 12);
    c.lineTo(labelX, currentY + 12);
    c.stroke();

    currentY += 46;
  }

  drawField('اسم ولقب التلميذ:', student.full_name, true);
  drawField('رقم المنخرط الرسمي:', student.membership_no);
  drawField('تاريخ الميلاد:', student.dob || '—');
  drawField('نوع الرعاية / التشخيص:', student.disability);
  drawField('القسم والفوج:', student.section);
  drawField('الموسم الدراسي:', student.academic_year || '2026-2027');

  // 6. QR Code Box (Left side)
  const qrX = 50;
  const qrY = 210;
  const qrSize = 180;

  // Background for QR
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qrSize, qrSize);

  // Draw real QR into offscreen canvas and blit
  const qrCanvas = document.createElement('canvas');
  const verifyUrl = `${window.location.origin}/#verify?code=${student.membership_no}`;
  drawQrToCanvas(qrCanvas, verifyUrl, { size: qrSize - 16, colorDark: NAVY });
  ctx.drawImage(qrCanvas, qrX + 8, qrY + 8);

  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = '500 14px Cairo, Tajawal, Arial';
  ctx.fillText('امسح للتحقق الرقمي', qrX + qrSize / 2, qrY + qrSize + 24);

  // 7. Footer / Stamp Area
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(26, H - 90, W - 52, 64);
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(26, H - 90, W - 52, 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = MUTED;
  ctx.font = '600 15px Cairo, Tajawal, Arial';
  ctx.fillText('العنوان: حي المعلمين، العطف، ولاية غرداية | هاتف: 044 44 48 34', W - 45, H - 52);

  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 16px Cairo, Tajawal, Arial';
  ctx.fillText('ختم وتأشيرة مدير المركز', 50, H - 52);

  // Simulated official stamp circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(280, H - 58, 30, 0, Math.PI * 2);
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 2]);
  ctx.stroke();
  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 11px Cairo, Tajawal, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('معتمد رسميًا', 280, H - 54);
  ctx.restore();
}

export async function downloadStudentCard(student: Student): Promise<void> {
  const canvas = document.createElement('canvas');
  await renderStudentCardToCanvas(canvas, student);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.download = `بطاقة_التلميذ_${student.membership_no}_${student.full_name.replace(/\s+/g, '_')}.jpg`;
  link.href = dataUrl;
  link.click();
}
