import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, FileText, Image, File, Music, Video, FolderOpen,
  Pencil, Trash2, BookOpen, Loader2,
} from 'lucide-react';
import { getJournalEntries, getProjectMedia, updateProject, deleteProject } from '../services/myceliumSave';
import { stripHtml } from '../utils/exportNote';

function getMediaIcon(type, name = '') {
  if (type === 'image') return <Image className="w-8 h-8 text-gray-400" />;
  if (type === 'audio') return <Music className="w-8 h-8 text-gray-400" />;
  if (type === 'video') return <Video className="w-8 h-8 text-gray-400" />;
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) return <FileText className="w-8 h-8 text-gray-400" />;
  return <File className="w-8 h-8 text-gray-400" />;
}

export default function ProjectView({
  project,
  userId,
  onBack,
  onOpenNote,
  onRenameProject,
  onDeleteProject,
  archivesForProject,
  fetchArchives,
}) {
  const [tab, setTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [media, setMedia] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!userId || !project?.id) return;
    setLoadingNotes(true);
    const data = await getJournalEntries(userId, 100, project.id);
    setNotes(data || []);
    setLoadingNotes(false);
  }, [userId, project?.id]);

  const loadMedia = useCallback(async () => {
    if (!userId || !project?.id) return;
    setLoadingMedia(true);
    const data = await getProjectMedia(userId, project.id);
    setMedia(data || []);
    setLoadingMedia(false);
  }, [userId, project?.id]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (tab === 'files') loadMedia();
  }, [tab, loadMedia]);

  const handleRename = async () => {
    if (!userId || !project?.id || !editName.trim()) return;
    const updated = await updateProject(userId, project.id, { name: editName.trim() });
    if (updated) {
      onRenameProject?.(updated);
      setIsEditingName(false);
      setEditName('');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer le projet « ${project.name} » ? Les notes ne seront pas supprimées.`)) return;
    const ok = await deleteProject(userId, project.id);
    if (ok) {
      onDeleteProject?.(project.id);
      onBack?.();
    }
  };

  const displayNotes = archivesForProject && archivesForProject.length > 0 ? archivesForProject : notes;

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--sj-bg)] text-[#e5e5e5]">
      <header className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-[#e5e5e5] transition flex-shrink-0"
            title="Retour"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-[#e5e5e5] text-lg font-medium focus:outline-none focus:border-gray-600 min-w-[200px]"
                  autoFocus
                />
                <button type="button" onClick={handleRename} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => { setIsEditingName(false); setEditName(''); }} className="p-1.5 rounded hover:bg-gray-800 text-gray-500">Annuler</button>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold truncate flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-gray-500 flex-shrink-0" style={{ color: project.color || '#6B7280' }} />
                  {project.name}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">{displayNotes.length} note(s)</p>
              </>
            )}
          </div>
        </div>
        {!isEditingName && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button type="button" onClick={() => { setEditName(project.name); setIsEditingName(true); }} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white" title="Renommer">
              <Pencil className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleDelete} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400" title="Supprimer le projet">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <div className="flex border-b border-gray-800">
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 ${tab === 'notes' ? 'border-gray-500 text-[#e5e5e5]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Notes
        </button>
        <button
          type="button"
          onClick={() => setTab('files')}
          className={`px-4 py-3 text-sm font-medium transition border-b-2 ${tab === 'files' ? 'border-gray-500 text-[#e5e5e5]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Fichiers & Médias
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'notes' && (
          <>
            {loadingNotes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
              </div>
            ) : displayNotes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune note dans ce projet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayNotes.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenNote(entry)}
                    className="text-left p-4 rounded-xl border border-gray-800 bg-[#1a1a1a] hover:bg-[#222] hover:border-gray-700 transition"
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-300 line-clamp-2">{stripHtml(entry.entry_text || '')}</p>
                    {(entry.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(entry.tags || []).slice(0, 3).map((t, i) => (
                          <span key={i} className="text-xs text-gray-500">#{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'files' && (
          <>
            {loadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun fichier ou média dans ce projet.</p>
                <p className="text-sm mt-1">Les pièces jointes des notes apparaîtront ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map((item, idx) => (
                  <div
                    key={`${item.entryId}-${item.url}-${idx}`}
                    className="rounded-xl border border-gray-800 bg-[#1a1a1a] overflow-hidden hover:border-gray-700 transition group"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 flex flex-col items-center justify-center min-h-[120px]"
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="w-full h-28 object-cover rounded" />
                      ) : (
                        <div className="w-full h-28 flex items-center justify-center rounded bg-gray-800/50">
                          {getMediaIcon(item.type, item.name)}
                        </div>
                      )}
                      <span className="text-xs text-gray-400 truncate w-full text-center mt-2" title={item.name}>{item.name}</span>
                      <span className="text-[10px] text-gray-600 mt-0.5">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : ''}
                      </span>
                    </a>
                    <div className="px-3 py-2 border-t border-gray-800">
                      <button
                        type="button"
                        onClick={() => onOpenNote({ id: item.entryId })}
                        className="w-full text-xs text-gray-500 hover:text-[#e5e5e5] hover:bg-gray-800/50 rounded py-1.5 transition"
                      >
                        Ouvrir la note source
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
