/**
 * @file storageCache.js
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 *
 * Utilidad reutilizable de almacenamiento en localStorage + memoria (Stale-While-Revalidate).
 * Evita peticiones repetitivas al navegar entre pantallas en OPSATEL.
 */

export const createStorageCache = (key, ttlMs = 15 * 60 * 1000) => {
  const timeKey = `${key}_time`;
  let memoryCache = null;
  let memoryCacheTime = 0;

  return {
    get: () => {
      const now = Date.now();
      if (memoryCache && (now - memoryCacheTime) < ttlMs) {
        return memoryCache;
      }
      if (typeof window === 'undefined') return null;
      try {
        const rawTime = localStorage.getItem(timeKey);
        const rawData = localStorage.getItem(key);
        if (rawData && rawTime) {
          const savedTime = parseInt(rawTime, 10);
          if (!isNaN(savedTime) && (now - savedTime) < ttlMs) {
            const parsed = JSON.parse(rawData);
            memoryCache = parsed;
            memoryCacheTime = savedTime;
            return parsed;
          }
        }
      } catch (e) {
        console.warn(`Error al leer caché de ${key} en localStorage:`, e);
      }
      return null;
    },
    set: (data) => {
      if (data === undefined || data === null) return;
      const now = Date.now();
      memoryCache = data;
      memoryCacheTime = now;
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(timeKey, now.toString());
      } catch (e) {
        console.warn(`No se pudo persistir ${key} en localStorage:`, e);
      }
    },
    clear: () => {
      memoryCache = null;
      memoryCacheTime = 0;
      if (typeof window === 'undefined') return;
      try {
        localStorage.removeItem(key);
        localStorage.removeItem(timeKey);
      } catch (e) {}
    }
  };
};

// Caches globales exportados para uso uniforme en toda la aplicación
export const extrasCache = createStorageCache('opsatel_cached_extras', 15 * 60 * 1000);
export const extrasPagosCache = createStorageCache('opsatel_cached_extras_pagos', 15 * 60 * 1000);
export const hojaRutaCache = createStorageCache('opsatel_cached_hoja_ruta', 15 * 60 * 1000);
export const callCenterCache = createStorageCache('opsatel_cached_callcenter', 15 * 60 * 1000);
export const comprobantesCache = createStorageCache('opsatel_cached_comprobantes', 10 * 60 * 1000);
export const conversacionesCache = createStorageCache('opsatel_cached_conversaciones', 10 * 60 * 1000);
export const whatsappAdminsCache = createStorageCache('opsatel_cached_whatsapp_admins', 30 * 60 * 1000);
export const whatsappDestinosCache = createStorageCache('opsatel_cached_whatsapp_destinos', 30 * 60 * 1000);
export const nodosCache = createStorageCache('opsatel_cached_nodos', 30 * 60 * 1000);
export const planesCache = createStorageCache('opsatel_cached_planes', 30 * 60 * 1000);
export const bancosCache = createStorageCache('opsatel_cached_bancos', 30 * 60 * 1000);
export const parroquiasCache = createStorageCache('opsatel_cached_parroquias', 30 * 60 * 1000);
