/**
 * @file realtimeService.js
 * @author David Mogrovejo dmogrovejo87@gmail.com
 * @copyright (c) 2026 David Mogrovejo. All Rights Reserved.
 * @notice Developed with AI assistance.
 * @hash bf26ee033418d5dcd984ad8115334e7ce788cfb5d2bd456cf6e6ee21b877a762
 *
 * OPSATEL - Servicio de Sincronización en Tiempo Real (Frontend)
 * Conexión persistente mediante Server-Sent Events (SSE) y reconciliación automática.
 */

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { clearStoredClientesCache } from './api';
import {
  extrasCache,
  extrasPagosCache,
  hojaRutaCache,
  callCenterCache,
  comprobantesCache,
  conversacionesCache,
  nodosCache,
  planesCache,
  bancosCache,
  parroquiasCache
} from '../utils/storageCache';

class RealtimeClient {
  constructor() {
    this.eventSource = null;
    this.reconnectTimeout = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 10000;
    this.versions = {};
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9);
    this.isConnecting = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.connect();

    // Reconciliar cuando la pestaña vuelve a estar visible o el usuario regresa
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkVersionsAgainstServer();
      }
    });

    window.addEventListener('focus', () => {
      this.checkVersionsAgainstServer();
    });

    window.addEventListener('online', () => {
      this.reconnectDelay = 1000;
      this.connect();
    });
  }

  connect() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {
        // Ignorar
      }
      this.eventSource = null;
    }

    try {
      const sseUrl = `/realtime/stream?client_id=${encodeURIComponent(this.clientId)}`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.reconnectDelay = 1000;
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.trim() === 'ping') return;
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data);
        } catch (err) {
          console.warn('[Realtime] Error procesando mensaje SSE:', err);
        }
      };

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        this.scheduleReconnect();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  handleIncomingEvent(data) {
    if (data.type === 'INITIAL_STATE' && data.versions) {
      for (const [mod, info] of Object.entries(data.versions)) {
        this.versions[mod] = info?.version || 1;
      }
      return;
    }

    if (data.type === 'MODULE_UPDATE' && data.module) {
      const prevVersion = this.versions[data.module] || 0;
      this.versions[data.module] = data.version || (prevVersion + 1);

      // Invalidar cachés locales para asegurar que la próxima lectura sea fresca
      this.invalidateCacheForModule(data.module);

      // Disparar evento en el DOM global para que los componentes suscritos se enteren
      window.dispatchEvent(new CustomEvent('opsatel:realtime', {
        detail: {
          module: data.module,
          action: data.action || 'update',
          version: data.version,
          timestamp: data.timestamp,
          extra: data.extra || {}
        }
      }));
    }
  }

  invalidateCacheForModule(module) {
    if (module === 'clientes' || module === 'all') {
      clearStoredClientesCache();
    }
    if (module === 'extras' || module === 'all') {
      extrasCache.clear();
      extrasPagosCache.clear();
    }
    if (module === 'hoja_ruta' || module === 'all') {
      hojaRutaCache.clear();
    }
    if (module === 'callcenter' || module === 'all') {
      callCenterCache.clear();
    }
    if (module === 'whatsapp' || module === 'all') {
      comprobantesCache.clear();
      conversacionesCache.clear();
    }
    if (module === 'configuraciones' || module === 'all') {
      nodosCache.clear();
      planesCache.clear();
      bancosCache.clear();
      parroquiasCache.clear();
    }
  }

  async checkVersionsAgainstServer() {
    try {
      const res = await axios.get('/realtime/version');
      if (res.data?.success && res.data?.versions) {
        const serverVersions = res.data.versions;
        for (const [mod, info] of Object.entries(serverVersions)) {
          const sVersion = info?.version || 1;
          const localVersion = this.versions[mod];

          // Si el servidor tiene una versión más nueva que la que recordamos
          if (localVersion !== undefined && sVersion > localVersion) {
            this.versions[mod] = sVersion;
            window.dispatchEvent(new CustomEvent('opsatel:realtime', {
              detail: {
                module: mod,
                action: 'reconcile',
                version: sVersion,
                timestamp: Date.now()
              }
            }));
          } else if (localVersion === undefined) {
            this.versions[mod] = sVersion;
          }
        }
      }
    } catch (e) {
      // Ignorar fallos temporales de conexión en segundo plano
    }
  }
}

export const realtimeClient = new RealtimeClient();

// Iniciar automáticamente en cliente
if (typeof window !== 'undefined') {
  realtimeClient.init();
}

/**
 * Hook de React para sincronización en tiempo real de una pantalla o módulo.
 * @param {string|string[]} modules - Nombre del módulo o lista de módulos a vigilar (ej. 'clientes', 'balance')
 * @param {Function} onUpdate - Función que se ejecutará en segundo plano al haber cambios
 * @param {Array} deps - Dependencias adicionales para recrear la suscripción si es necesario
 */
export const useRealtimeSync = (modules, onUpdate, deps = []) => {
  const onUpdateRef = useRef(onUpdate);
  const timerRef = useRef(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const targetModules = Array.isArray(modules) ? modules : [modules];

    const handleEvent = (event) => {
      const detail = event?.detail;
      if (!detail || !detail.module) return;

      const matches = detail.module === 'all' || targetModules.includes(detail.module);
      if (matches) {
        // Debounce de 350ms para coalescer ráfagas de actualizaciones
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (typeof onUpdateRef.current === 'function') {
            try {
              onUpdateRef.current(detail);
            } catch (err) {
              console.error('[Realtime Hook] Error al ejecutar actualización:', err);
            }
          }
        }, 350);
      }
    };

    window.addEventListener('opsatel:realtime', handleEvent);
    return () => {
      window.removeEventListener('opsatel:realtime', handleEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [JSON.stringify(modules), ...deps]);
};
