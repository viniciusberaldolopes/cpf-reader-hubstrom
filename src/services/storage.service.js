import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

function safeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function uploadPdf(file, uploadId, onProgress) {
  if (!storage)
    throw new Error("Configure as variáveis do Firebase no arquivo .env.");
  const storagePath = `pdfs/${uploadId}/${safeName(file.name)}`;
  const fileRef = ref(storage, storagePath);
  const task = uploadBytesResumable(fileRef, file, {
    contentType: "application/pdf",
  });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        onProgress(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      reject,
      async () => {
        resolve({
          storagePath,
          downloadUrl: await getDownloadURL(task.snapshot.ref),
        });
      },
    );
  });
}

export function removePdf(storagePath) {
  if (!storage) return Promise.resolve();
  return deleteObject(ref(storage, storagePath));
}
