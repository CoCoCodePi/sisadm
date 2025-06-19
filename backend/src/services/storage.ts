import { Readable } from "stream";

// Servicio ficticio para manejar almacenamiento (puede ser AWS S3, Google Cloud Storage, etc.)
export const uploadToStorage = async (file: Express.Multer.File, path: string): Promise<string> => {
  try {
    // Aquí se simula la subida al almacenamiento
    const url = `https://storage.example.com/${path}/${file.originalname}`;
    console.log(`Archivo subido a: ${url}`);
    return url;
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    throw new Error("Error subiendo archivo");
  }
};

export const deleteFromStorage = async (url: string): Promise<void> => {
  try {
    // Aquí se simula la eliminación en el almacenamiento
    console.log(`Archivo eliminado de: ${url}`);
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    throw new Error("Error eliminando archivo");
  }
};