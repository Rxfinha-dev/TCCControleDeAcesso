import { useEffect, useState } from 'react';
import { studentsApi } from '../api';
import { UserIcon } from './Icons';

interface StudentPhotoProps {
  studentId?: number | null;
  hasPhoto?: boolean;
  /** Pré-visualização local (arquivo escolhido e ainda não enviado). */
  previewUrl?: string | null;
  /** Muda quando a foto é atualizada, forçando recarregar. */
  version?: string;
  alt: string;
  className?: string;
}

/** Carrega a foto pela API com o token de acesso (a rota é protegida). */
export function StudentPhoto({ studentId, hasPhoto, previewUrl, version, alt, className }: StudentPhotoProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewUrl || !studentId || !hasPhoto) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    studentsApi
      .photo(studentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [studentId, hasPhoto, previewUrl, version]);

  // Só aceita URLs locais criadas por URL.createObjectURL (blob:), nunca texto arbitrário.
  const candidate = previewUrl ?? url;
  const src = candidate?.startsWith('blob:') ? candidate : null;
  return (
    <div className={`student-photo ${className ?? ''}`}>
      {src ? <img src={src} alt={alt} /> : <UserIcon width={56} height={56} />}
    </div>
  );
}
