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
  // push() gera uma chave ordenável sem precisar gravar o registro neste momento.
  return push(child(ref(database), "uploads")).key;
}

export function saveExtraction(payload) {
  const timestamp = Date.now();
  const updates = {};

  // Guarda um resumo do arquivo para alimentar os contadores e a data da tela.
  updates[`uploads/${payload.uploadId}`] = {
    fileName: payload.file.name,
    fileSize: payload.file.size,
    storagePath: payload.storagePath,
    downloadUrl: payload.downloadUrl,
    uploadedAt: timestamp,
    validCount: payload.validDocuments.length,
    invalidCount: payload.invalidCount,
    documents: payload.documents,
  };

  // Apenas os documentos matematicamente válidos entram no histórico permanente.
  payload.validDocuments.forEach((document) => {
    const id = push(child(ref(database), "cpfRecords")).key;
    updates[`cpfRecords/${id}`] = {
      type: document.type,
      formatted: document.formatted,
      normalized: document.normalized,
      fileName: payload.file.name,
      uploadId: payload.uploadId,
      extractedAt: timestamp,
    };
  });

  // Um update multipath grava o upload e os documentos em uma única operação atômica.
  return update(ref(database), updates).then(() => timestamp);
}

// Centraliza a assinatura em tempo real usada pelas duas listas do dashboard.
function subscribe(path, dateField, callback, errorCallback) {
  if (!database) return () => {};
  return onValue(
    query(ref(database, path), orderByChild(dateField)),
    (snapshot) => {
      const values = snapshot.val() || {};
      const list = Object.entries(values).map(([id, value]) => {
        const item = { id, ...value };

        // Registros antigos não possuem type e são CPFs por definição.
        if (path === "cpfRecords" && !item.type) item.type = "CPF";
        return item;
      });

      // O Firebase ordena de forma crescente; a interface mostra os novos primeiro.
      callback(list.sort((a, b) => b[dateField] - a[dateField]));
    },
    errorCallback
  );
}

export function subscribeToDocumentRecords(callback, errorCallback) {
  return subscribe("cpfRecords", "extractedAt", callback, errorCallback);
}

export function subscribeToUploads(callback, errorCallback) {
  return subscribe("uploads", "uploadedAt", callback, errorCallback);
}
