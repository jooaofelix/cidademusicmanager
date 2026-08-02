"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  const s = v === null ? "" : String(v).trim();
  return s || null;
}

function num(fd: FormData, key: string) {
  const raw = fd.get(key);
  if (raw === null || String(raw).trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function songData(formData: FormData) {
  return {
    title: str(formData, "title") ?? "",
    artist: str(formData, "artist"),
    defaultKey: str(formData, "defaultKey"),
    bpm: num(formData, "bpm"),
    timeSig: str(formData, "timeSig"),
    versionUrl: str(formData, "versionUrl"),
    vsUrl: str(formData, "vsUrl"),
    chartUrl: str(formData, "chartUrl"),
    lyrics: str(formData, "lyrics"),
    tags: str(formData, "tags"),
    notes: str(formData, "notes"),
  };
}

export async function createSong(formData: FormData) {
  await requireMember();

  const data = songData(formData);
  if (!data.title) return;

  const song = await db.song.create({ data });
  revalidatePath("/repertorio");
  redirect(`/repertorio/${song.id}`);
}

export async function updateSong(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const data = songData(formData);
  if (!id || !data.title) return;

  await db.song.update({ where: { id }, data });
  revalidatePath("/repertorio");
  revalidatePath(`/repertorio/${id}`);
  redirect(`/repertorio/${id}`);
}

export async function toggleSongActive(formData: FormData) {
  await requireMember();

  const id = String(formData.get("id"));
  const song = await db.song.findUnique({ where: { id } });
  if (!song) return;

  await db.song.update({ where: { id }, data: { active: !song.active } });
  revalidatePath("/repertorio");
  revalidatePath(`/repertorio/${id}`);
}

export async function deleteSong(formData: FormData) {
  const me = await requireMember();
  if (!me.isAdmin) return;

  await db.song.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/repertorio");
  redirect("/repertorio");
}
