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
