/**
 * @file textUtils.js
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @description Utilidades centrales de estandarización de texto para el Frontend de Opsatel.
 *              - Reemplaza 'ñ' y 'Ñ' por 'N'.
 *              - Remueve todas las tildes y diacríticos (á->A, é->E, í->I, etc.).
 *              - Convierte todo el texto a MAYÚSCULAS.
 */

/**
 * Estandariza un texto aplicando las reglas del sistema Opsatel:
 * 1. Reemplaza 'ñ' y 'Ñ' por 'N'.
 * 2. Elimina tildes y diacríticos (NFD + regex).
 * 3. Convierte a MAYÚSCULAS.
 * @param {string|any} val
 * @returns {string|any}
 */
export function normalizeOpsatelText(val) {
  if (val === null || val === undefined) return val;
  const s = String(val);
  if (!s) return s;
  return s
    .replace(/ñ/g, 'N')
    .replace(/Ñ/g, 'N')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Normaliza campos específicos de un objeto de datos (payload).
 * @param {Object} obj Objeto a procesar
 * @param {string[]} fields Lista de propiedades a normalizar
 * @returns {Object} Nuevo objeto con los campos normalizados
 */
export function normalizePayloadFields(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  for (const f of fields) {
    if (copy[f] !== undefined && copy[f] !== null && typeof copy[f] === 'string') {
      copy[f] = normalizeOpsatelText(copy[f]);
    }
  }
  return copy;
}

/**
 * Reemplaza de forma recursiva cualquier 'ñ' o 'Ñ' por 'N' en cualquier estructura (strings, arrays, objetos).
 * @param {any} obj
 * @returns {any}
 */
export function replaceEnesRecursively(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/ñ/g, 'N').replace(/Ñ/g, 'N');
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceEnesRecursively);
  }
  if (typeof obj === 'object' && !(obj instanceof FormData) && !(obj instanceof Blob)) {
    const out = {};
    for (const k of Object.keys(obj)) {
      const cleanKey = k.replace(/ñ/g, 'N').replace(/Ñ/g, 'N');
      out[cleanKey] = replaceEnesRecursively(obj[k]);
    }
    return out;
  }
  return obj;
}
