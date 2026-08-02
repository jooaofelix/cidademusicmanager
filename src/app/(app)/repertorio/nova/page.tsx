import { PageHeader } from "@/components/ui";
import { SongForm } from "@/components/SongForm";
import { createSong } from "../actions";

export default function NovaMusicaPage() {
  return (
    <>
      <PageHeader title="Nova música" back={{ href: "/repertorio" }} />
      <SongForm action={createSong} submitLabel="Cadastrar música" />
    </>
  );
}
