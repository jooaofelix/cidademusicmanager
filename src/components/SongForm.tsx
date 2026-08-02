import { KEYS } from "@/lib/constants";

type SongLike = {
  id?: string;
  title?: string;
  artist?: string | null;
  defaultKey?: string | null;
  bpm?: number | null;
  timeSig?: string | null;
  versionUrl?: string | null;
  vsUrl?: string | null;
  chartUrl?: string | null;
  lyrics?: string | null;
  tags?: string | null;
  notes?: string | null;
};

export function SongForm({
  song,
  action,
  submitLabel,
}: {
  song?: SongLike;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {song?.id && <input type="hidden" name="id" value={song.id} />}

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="title">Nome da música *</label>
          <input id="title" name="title" required defaultValue={song?.title ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="artist">Artista / Ministério</label>
          <input id="artist" name="artist" defaultValue={song?.artist ?? ""} className="input" placeholder="Gateway Worship, Morada..." />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label" htmlFor="defaultKey">Tom</label>
            <select id="defaultKey" name="defaultKey" defaultValue={song?.defaultKey ?? ""} className="input">
              <option value="">—</option>
              {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bpm">BPM</label>
            <input id="bpm" name="bpm" type="number" inputMode="numeric" defaultValue={song?.bpm ?? ""} className="input" placeholder="72" />
          </div>
          <div>
            <label className="label" htmlFor="timeSig">Compasso</label>
            <input id="timeSig" name="timeSig" defaultValue={song?.timeSig ?? ""} className="input" placeholder="4/4" />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="section-title">Links</h3>
        <div>
          <label className="label" htmlFor="versionUrl">Versão que tocamos</label>
          <input id="versionUrl" name="versionUrl" type="url" defaultValue={song?.versionUrl ?? ""} className="input" placeholder="https://youtube.com/watch?v=..." />
          <p className="mt-1 text-xs text-slate-500">YouTube, Spotify — a referência oficial da banda.</p>
        </div>
        <div>
          <label className="label" htmlFor="vsUrl">VS / Multitrack</label>
          <input id="vsUrl" name="vsUrl" type="url" defaultValue={song?.vsUrl ?? ""} className="input" placeholder="https://drive.google.com/..." />
          <p className="mt-1 text-xs text-slate-500">
            Link da pasta ou arquivo no Google Drive. Deixe compartilhado como
            “qualquer pessoa com o link”.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="chartUrl">Cifra / Partitura</label>
          <input id="chartUrl" name="chartUrl" type="url" defaultValue={song?.chartUrl ?? ""} className="input" placeholder="https://cifraclub.com.br/..." />
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="tags">Tags</label>
          <input id="tags" name="tags" defaultValue={song?.tags ?? ""} className="input" placeholder="adoracao, celebracao, natal" />
          <p className="mt-1 text-xs text-slate-500">Separe por vírgula.</p>
        </div>
        <div>
          <label className="label" htmlFor="notes">Observações da banda</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={song?.notes ?? ""} className="input" placeholder="Entrada só com teclado, repetir ponte 2x..." />
        </div>
        <div>
          <label className="label" htmlFor="lyrics">Letra</label>
          <textarea id="lyrics" name="lyrics" rows={8} defaultValue={song?.lyrics ?? ""} className="input font-mono text-sm" />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full py-3">{submitLabel}</button>
    </form>
  );
}
