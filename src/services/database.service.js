import {
  ref,
  child,
  push,
  update,
  onValue,
  query,
  orderByChild,
} from "firebase/database";
import { database } from "./firebase";

export function createUploadId() {
  if (!database)
    throw new Error("Configure as variáveis do Firebase no arquivo .env.");
  return push(child(ref(database), "uploads")).key;
}

export function saveExtraction(payload) {
  const timestamp = Date.now();
  const updates = {};
  updates[`uploads/${payload.uploadId}`] = {
    fileName: payload.file.name,
    fileSize: payload.file.size,
    storagePath: payload.storagePath,
    downloadUrl: payload.downloadUrl,
    uploadedAt: timestamp,
    validCount: payload.validCpfs.length,
    invalidCount: payload.invalidCount,
  };

  payload.validCpfs.forEach((cpf) => {
    const id = push(child(ref(database), "cpfRecords")).key;
    updates[`cpfRecords/${id}`] = {
      formatted: cpf.formatted,
      normalized: cpf.normalized,
      fileName: payload.file.name,
      uploadId: payload.uploadId,
      extractedAt: timestamp,
    };
  });
  return update(ref(database), updates).then(() => timestamp);
}

function subscribe(path, dateField, callback, errorCallback) {
  if (!database) return () => {};
  return onValue(
    query(ref(database, path), orderByChild(dateField)),
    (snapshot) => {
      const values = snapshot.val() || {};
      const list = Object.entries(values).map(([id, value]) => ({
        id,
        ...value,
      }));
      callback(list.sort((a, b) => b[dateField] - a[dateField]));
    },
    errorCallback,
  );
}

export function subscribeToCpfRecords(callback, errorCallback) {
  return subscribe("cpfRecords", "extractedAt", callback, errorCallback);
}

export function subscribeToUploads(callback, errorCallback) {
  return subscribe("uploads", "uploadedAt", callback, errorCallback);
}
