import { FileText } from 'lucide-react';

export default function MediaViewer({ media }) {
  if (!media) return null;

  const type = media.type || (media.url?.match(/\.(mp4|webm|mov)$/i) ? 'video' : media.url?.match(/\.(png|jpe?g|gif|webp)$/i) ? 'image' : 'file');

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800 bg-[#141414]">
        <p className="text-sm text-gray-200 truncate">{media.name || 'Média'}</p>
        <p className="text-xs text-gray-500 truncate">{media.url}</p>
      </div>
      <div className="flex-1 min-h-0 p-4 flex items-center justify-center bg-[#0f0f0f]">
        {type === 'image' ? (
          <img src={media.url} alt={media.name || ''} className="max-w-full max-h-full object-contain rounded-lg border border-gray-800" />
        ) : type === 'video' ? (
          <video src={media.url} controls className="max-w-full max-h-full rounded-lg border border-gray-800" />
        ) : type === 'audio' ? (
          <audio src={media.url} controls className="w-full" />
        ) : (
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-md rounded-xl border border-gray-800 bg-[#111111] p-6 hover:bg-[#141414] transition flex flex-col items-center justify-center gap-2"
          >
            <FileText className="w-10 h-10 text-gray-400" />
            <p className="text-sm text-gray-200 truncate w-full text-center">{media.name || 'Fichier'}</p>
            <p className="text-xs text-gray-500">Ouvrir / télécharger</p>
          </a>
        )}
      </div>
    </div>
  );
}

