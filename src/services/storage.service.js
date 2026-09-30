import { supabase } from "./supabase";

const BUCKET = "pdfs";

// Retira acentos e caracteres problemáticos antes de montar o caminho no bucket.
function safeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadPdf(file, uploadId, onProgress) {
  if (!supabase) {
    throw new Error("Configure as variáveis do Supabase no arquivo .env.");
  }

  // Cada upload recebe uma pasta própria para evitar conflito entre nomes iguais.
  const storagePath = `${uploadId}/${safeName(file.name)}`;

  // O SDK não informa progresso por byte neste método. Os valores representam etapas.
  onProgress(65);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (error) throw error;

  onProgress(90);

  // O bucket é público para permitir o download direto pela tela do teste.
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { storagePath, downloadUrl: data.publicUrl };
}

export async function removePdf(storagePath) {
  if (!supabase || !storagePath) return;

  // Usado como compensação se o PDF subir, mas a gravação no Firebase falhar.
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw error;
}
