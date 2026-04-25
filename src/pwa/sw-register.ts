/**
 * Registro do Service Worker e prompt de atualização.
 *
 * Usa `registerType: 'prompt'` — notifica o usuário via toast discreto
 * quando uma nova versão está disponível. O update é aplicado no próximo
 * reload, sem interromper partida em andamento.
 *
 * Ref: 03-TECH-STACK.md § 5.2
 * Ref: Decisão P10 — PWA offline-first, notificar updates
 */

import { registerSW } from 'virtual:pwa-register';

// ---------------------------------------------------------------------------
// Update Toast UI
// ---------------------------------------------------------------------------

/** Cria o toast de atualização no DOM. */
function createUpdateToast(): {
  container: HTMLDivElement;
  show: () => void;
  hide: () => void;
} {
  const container = document.createElement('div');
  container.id = 'pwa-update-toast';
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'polite');

  container.innerHTML = `
    <div class="pwa-toast-content">
      <span class="pwa-toast-icon">🔄</span>
      <span class="pwa-toast-message">Nova versão disponível!</span>
      <button id="pwa-update-btn" class="pwa-toast-btn">Atualizar</button>
      <button id="pwa-dismiss-btn" class="pwa-toast-dismiss" aria-label="Fechar">&times;</button>
    </div>
  `;

  document.body.appendChild(container);

  return {
    container,
    show: () => container.classList.add('visible'),
    hide: () => container.classList.remove('visible'),
  };
}

/** Cria o toast de offline-ready no DOM. */
function createOfflineToast(): {
  container: HTMLDivElement;
  show: () => void;
  hide: () => void;
} {
  const container = document.createElement('div');
  container.id = 'pwa-offline-toast';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  container.innerHTML = `
    <div class="pwa-toast-content">
      <span class="pwa-toast-icon">✅</span>
      <span class="pwa-toast-message">Pronto para jogar offline!</span>
      <button id="pwa-offline-dismiss" class="pwa-toast-dismiss" aria-label="Fechar">&times;</button>
    </div>
  `;

  document.body.appendChild(container);

  return {
    container,
    show: () => container.classList.add('visible'),
    hide: () => container.classList.remove('visible'),
  };
}

// ---------------------------------------------------------------------------
// Service Worker Registration
// ---------------------------------------------------------------------------

/** Inicializa o registro do Service Worker. */
export function initPWA(): void {
  const updateToast = createUpdateToast();
  const offlineToast = createOfflineToast();

  let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

  updateSW = registerSW({
    immediate: true,

    onNeedRefresh() {
      // Mostrar toast de update
      updateToast.show();
    },

    onOfflineReady() {
      // Mostrar toast de offline-ready (some automaticamente após 4s)
      offlineToast.show();
      setTimeout(() => offlineToast.hide(), 4000);
    },

    onRegisteredSW(swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      // Verificar updates periodicamente (a cada 60min)
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }

      if (import.meta.env.DEV) {
        console.log(`[PWA] Service Worker registrado: ${swUrl}`);
      }
    },

    onRegisterError(error: unknown) {
      console.error('[PWA] Erro ao registrar Service Worker:', error);
    },
  });

  // Handler do botão "Atualizar"
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.id === 'pwa-update-btn') {
      updateToast.hide();
      updateSW?.();
    }

    if (target.id === 'pwa-dismiss-btn') {
      updateToast.hide();
    }

    if (target.id === 'pwa-offline-dismiss') {
      offlineToast.hide();
    }
  });
}
