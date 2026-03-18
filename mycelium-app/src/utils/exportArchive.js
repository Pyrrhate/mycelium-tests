/**
 * Export complet du Second Cerveau en archive .zip
 * Notes en Markdown, organisées par projet.
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getJournalEntries, getProjects } from '../services/myceliumSave';
import { stripHtml } from './exportNote';

function slug(str) {
  if (!str || typeof str !== 'string') return 'note';
  return str
    .slice(0, 60)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase() || 'note';
}

/**
 * Génère une archive ZIP de toutes les notes de l'utilisateur, classées par projet.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function generateDataArchive(userId) {
  if (!userId) throw new Error('Utilisateur requis');
  const zip = new JSZip();

  const [entries, projects] = await Promise.all([
    getJournalEntries(userId, 5000, undefined),
    getProjects(userId),
  ]);

  const projectMap = new Map((projects || []).map((p) => [p.id, p.name]));
  const folderNames = new Map();

  for (const entry of entries || []) {
    const projectId = entry.project_id || null;
    const folderName = projectId ? (projectMap.get(projectId) || 'Sans_Projet') : 'Sans_Projet';
    if (!folderNames.has(folderName)) folderNames.set(folderName, true);
    const dateStr = entry.created_at ? new Date(entry.created_at).toISOString().slice(0, 10) : '1970-01-01';
    const text = stripHtml(entry.entry_text || '');
    const nameSlug = slug(text);
    const idPart = entry.id ? entry.id.slice(0, 8) : Date.now();
    const fileName = `${dateStr}_${nameSlug}_${idPart}.md`;
    const content = `# Note du ${dateStr}\n\n${text}\n`;
    const safeFolder = folderName.replace(/[/\\?*:|"]/g, '_');
    zip.file(`${safeFolder}/${fileName}`, content, { date: entry.created_at ? new Date(entry.created_at) : new Date() });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Mon_Second_Cerveau_Backup_${date}.zip`);
}
