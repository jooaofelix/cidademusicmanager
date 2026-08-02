import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { SongForm } from "@/components/SongForm";
import { deleteSong, updateSong } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarMusicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireMember();
  const song = await db.song.findUnique({ where: { id } });
  if (!song) notFound();

  return (
    <>
      <PageHeader title="Editar música" back={{ href: `/repertorio/${song.id}` }} />
      <SongForm song={song} action={updateSong} submitLabel="Salvar alterações" />

      {me.isAdmin && (
        <form action={deleteSong} className="mt-6">
          <input type="hidden" name="id" value={song.id} />
          <button type="submit" className="btn-danger w-full">Excluir música</button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Prefira arquivar — excluir remove a música das OCs antigas.
          </p>
        </form>
      )}
    </>
  );
}
