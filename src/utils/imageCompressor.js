import heic2any from 'heic2any';

/**
 * Detecta si un archivo corresponde al formato HEIC/HEIF (típico de iPhone / iOS).
 */
export const isHeic = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence'
  );
};

/**
 * Convierte un archivo HEIC/HEIF de iPhone a JPEG.
 */
export const convertHeicToJpeg = async (file) => {
  if (!isHeic(file)) return file;
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.88,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    const rawName = file.name || 'foto_iphone.heic';
    const baseName = rawName.replace(/\.(heic|heif)$/i, '');
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('No se pudo convertir HEIC en navegador, enviando original o siguiente paso:', err);
    return file;
  }
};

/**
 * Comprime y redimensiona una imagen proporcionalmente para optimizar su peso sin perder nitidez.
 * Acepta fotos pesadas de hasta 20-25 MB (incluyendo fotos de iPhone).
 * @param {File|Blob} file Archivo de imagen a comprimir.
 * @param {number} maxWidth Ancho/alto máximo permitido (por defecto 2048px).
 * @param {number} quality Calidad JPEG (0.1 a 1.0, por defecto 0.85).
 * @returns {Promise<File>} Archivo comprimido en formato JPEG.
 */
export const compressImage = async (file, maxWidth = 2048, quality = 0.85) => {
  if (!file) return file;

  // Si es foto de iPhone HEIC, convertir primero a JPEG
  let workingFile = file;
  if (isHeic(workingFile)) {
    workingFile = await convertHeicToJpeg(workingFile);
  }

  // Si no es imagen reconocida o no tiene tipo imagen
  const isImageLike =
    (workingFile.type && workingFile.type.startsWith('image/')) ||
    /\.(jpe?g|png|webp|bmp|gif|heic|heif)$/i.test(workingFile.name || '');

  if (!isImageLike) return workingFile;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const attemptCompress = (wMax, qual) => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > wMax || height > wMax) {
            if (width > height) {
              height = Math.round((height * wMax) / width);
              width = wMax;
            } else {
              width = Math.round((width * wMax) / height);
              height = wMax;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(workingFile);

              // Si aún después de la compresión supera 2.0 MB, reducir adaptativamente dimensiones/calidad
              if (blob.size > 2 * 1024 * 1024 && qual > 0.45) {
                return attemptCompress(Math.round(wMax * 0.85), qual - 0.12);
              }

              const rawName = workingFile.name || 'foto.jpg';
              const baseName = rawName.includes('.')
                ? rawName.substring(0, rawName.lastIndexOf('.'))
                : rawName;

              const compressedFile = new File([blob], `${baseName}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            qual
          );
        };

        attemptCompress(maxWidth, quality);
      };

      img.onerror = () => resolve(workingFile);
      img.src = event.target.result;
    };

    reader.onerror = () => resolve(workingFile);
    reader.readAsDataURL(workingFile);
  });
};

/**
 * Procesa un archivo o entrada (File, Blob, Data URL, enlace HTTP) asegurando:
 * 1. Que no supere el límite máximo (por defecto 25 MB para permitir fotos de 20 MB).
 * 2. Que se convierta HEIC si aplica.
 * 3. Que se comprima eficientemente.
 * 
 * @param {File|Blob|string} itemOrFile 
 * @param {string} defaultName 
 * @param {number} maxAllowedMB Límite máximo en MB (ej. 25 MB).
 * @returns {Promise<{file: File|null, error: string|null}>}
 */
export const processImage = async (itemOrFile, defaultName = 'foto.jpg', maxAllowedMB = 25) => {
  if (!itemOrFile) return { file: null, error: null };

  let file = null;
  let mimeType = 'image/jpeg';
  let fileName = defaultName;

  if (itemOrFile instanceof File) {
    file = itemOrFile;
    mimeType = file.type || 'image/jpeg';
    fileName = file.name || defaultName;
  } else if (itemOrFile instanceof Blob) {
    file = itemOrFile;
    mimeType = file.type || 'image/jpeg';
  } else if (typeof itemOrFile === 'string') {
    const str = itemOrFile.trim();
    if (str.startsWith('data:image/')) {
      try {
        const arr = str.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        file = new Blob([u8arr], { type: mimeType });
      } catch (err) {
        console.error('Error al procesar data URL:', err);
        return { file: null, error: 'No se pudo leer la imagen pegada.' };
      }
    } else if (str.startsWith('http://') || str.startsWith('https://')) {
      try {
        const res = await fetch(str);
        const blob = await res.blob();
        file = blob;
        mimeType = blob.type || 'image/jpeg';
      } catch (err) {
        console.error('Error al descargar imagen desde URL:', err);
        return { file: null, error: 'No se pudo descargar la imagen remota.' };
      }
    }
  }

  if (!file) return { file: null, error: null };

  // Validar peso inicial del archivo
  const maxBytes = maxAllowedMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      file: null,
      error: `La foto "${fileName}" pesa ${sizeMb} MB y supera el límite máximo permitido de ${maxAllowedMB} MB.`,
    };
  }

  const baseFile =
    file instanceof File ? file : new File([file], fileName, { type: mimeType });

  try {
    const compressed = await compressImage(baseFile);
    return { file: compressed, error: null };
  } catch (err) {
    console.error('Error al comprimir imagen:', err);
    return { file: baseFile, error: null };
  }
};
