/**
 * Export de notes : PDF, DOCX, TXT
 */
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/** Retire les balises HTML pour obtenir du texte brut (et compter les caractères). */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

/**
 * Export PDF à partir du HTML de la note (conserve le formatage visuel).
 * @param {string} htmlContent - HTML de la note
 * @param {string} filename - Nom du fichier sans extension
 */
export async function exportNoteToPdf(htmlContent, filename = 'note') {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;padding:20mm;background:#1a1a1a;color:#e5e5e5;font-family:Inter,Roboto,sans-serif;font-size:11pt;line-height:1.6;';
  container.innerHTML = htmlContent || '<p>Aucun contenu.</p>';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#1a1a1a',
      logging: false,
    });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const imgW = pageW - 2 * margin;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= pageH - 2 * margin;

    while (heightLeft > 0) {
      position = heightLeft - imgH + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
      heightLeft -= pageH - 2 * margin;
    }

    pdf.save(`${filename}.pdf`);
  } catch (err) {
    document.body.removeChild(container);
    throw err;
  }
}

/**
 * Export DOCX (Word) à partir du texte de la note (paragraphes).
 */
export async function exportNoteToDocx(htmlContent, filename = 'note') {
  const text = stripHtml(htmlContent);
  const paragraphs = text.split(/\n\n+/).filter(Boolean).map(
    (block) => new Paragraph({
      children: [new TextRun(block)],
      spacing: { after: 200 },
    })
  );
  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun('Aucun contenu.')] }));
  }
  const doc = new Document({
    sections: [{
      children: paragraphs,
    }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export fichier texte brut.
 */
export function exportNoteToTxt(htmlContent, filename = 'note') {
  const text = stripHtml(htmlContent);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Génère un PDF combiné à partir de plusieurs notes (HTML formaté, saut de page entre chaque).
 * @param {Array<{ id: string, entry_text: string, created_at?: string }>} notes
 * @param {string} title - Titre global du document
 * @param {string} filename - Nom du fichier sans extension
 */
export async function exportNotesToCombinedPdf(notes, title = 'Notes exportées', filename = 'notes-combined') {
  if (!notes?.length) return;
  const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let first = true;

  for (const note of notes) {
    if (!first) pdf.addPage();
    first = false;
    const dateStr = note.created_at ? new Date(note.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '';
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:' + (pageW - 2 * margin) + 'mm;padding:5mm;background:#fff;color:#111;font-family:Inter,sans-serif;font-size:11pt;line-height:1.6;';
    container.innerHTML = (dateStr ? `<p style="font-size:10px;color:#666;margin-bottom:8px;">${dateStr}</p>` : '') + (note.entry_text || '<p>Aucun contenu.</p>');
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(container);
      const imgW = pageW - 2 * margin;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let pos = margin;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, pos, imgW, imgH);
      heightLeft -= pageH - 2 * margin;
      while (heightLeft > 0) {
        pdf.addPage();
        pos = heightLeft - imgH + margin;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, pos, imgW, imgH);
        heightLeft -= pageH - 2 * margin;
      }
    } catch (e) {
      document.body.removeChild(container);
      const text = stripHtml(note.entry_text || '');
      pdf.setFontSize(11);
      pdf.text((dateStr ? dateStr + '\n\n' : '') + text.substring(0, 2000), margin, margin);
    }
  }
  pdf.save(`${filename}.pdf`);
}
