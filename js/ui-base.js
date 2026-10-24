/**
 * ui-base.js - Lightweight UI helpers for modals, alerts, and menus.
 */
(function () {
    'use strict';

    const openStack = [];
    const focusMap = new Map();

    function t(key, fallback) {
        const lang = window.i18n?.getLanguage?.() || 'ko';
        return window.translations?.[lang]?.[key] || fallback;
    }
    function exposeI18nHelpers() {
        if (!window.dlI18nText) {
            window.dlI18nText = (key, fallback) => t(key, fallback);
        }
        if (!window.dlI18nImgFallback) {
            window.dlI18nImgFallback = (img) => {
                if (!img || !img.parentElement) return;
                img.style.display = 'none';
                const text = t('image_placeholder', 'Image unavailable');
                img.parentElement.innerHTML = `<div class="text-gray-400">${text}</div>`;
            };
        }
    }

    function isAnyModalOpen() {
        return document.querySelector('[data-modal="true"][aria-hidden="false"]') !== null;
    }

    function lockBodyScroll() {
        document.body.classList.add('overflow-hidden');
    }

    function unlockBodyScroll() {
        document.body.classList.remove('overflow-hidden');
    }

    function setModalState(modal, open, options) {
        if (!modal) return;
        const id = modal.id || '';
        const isHidden = modal.classList.contains('hidden');
        const willOpen = open !== undefined ? open : isHidden;
        modal.classList.toggle('hidden', !willOpen);
        modal.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

        if (willOpen) {
            focusMap.set(id, document.activeElement);
            openStack.push(id);
            lockBodyScroll();
            const focusTarget = options?.focusSelector
                ? modal.querySelector(options.focusSelector)
                : modal.querySelector('[data-modal-focus]') ||
                  modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus();
            }
        } else {
            const prev = focusMap.get(id);
            focusMap.delete(id);
            const idx = openStack.lastIndexOf(id);
            if (idx >= 0) openStack.splice(idx, 1);
            if (!isAnyModalOpen()) {
                unlockBodyScroll();
            }
            if (prev && typeof prev.focus === 'function') {
                prev.focus();
            }
        }
    }

    function closeTopModal() {
        const id = openStack[openStack.length - 1];
        if (!id) return;
        const modal = document.getElementById(id);
        setModalState(modal, false);
    }

    function ensureDialog() {
        let dialog = document.getElementById('dl-ui-dialog');
        if (dialog) return dialog;

        dialog = document.createElement('div');
        dialog.id = 'dl-ui-dialog';
        dialog.className = 'fixed inset-0 z-[70] hidden';
        dialog.setAttribute('data-modal', 'true');
        dialog.setAttribute('aria-hidden', 'true');
        dialog.innerHTML = `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" data-dialog-overlay></div>
            <div class="absolute top-1/2 left-1/2 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6" role="dialog" aria-modal="true" aria-labelledby="dl-ui-title" aria-describedby="dl-ui-message" tabindex="-1">
                <div class="flex items-start justify-between gap-4 mb-4">
                    <h3 id="dl-ui-title" class="text-xl font-black text-gray-900"></h3>
                    <button type="button" class="text-gray-400 hover:text-gray-700 transition" data-dialog-close aria-label="Close dialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p id="dl-ui-message" class="text-gray-600 text-sm leading-relaxed"></p>
                <div class="mt-6 flex justify-end gap-2" data-dialog-actions>
                    <button type="button" class="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 transition" data-dialog-cancel></button>
                    <button type="button" class="px-4 py-2 rounded-full bg-[#00FF85] text-black font-bold hover:bg-[#00CC6A] transition" data-dialog-ok></button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        const overlay = dialog.querySelector('[data-dialog-overlay]');
        const closeBtn = dialog.querySelector('[data-dialog-close]');
        overlay?.addEventListener('click', () => {
            if (dialog.dataset.mode === 'alert') {
                dialog._resolve?.(true);
            } else {
                dialog._resolve?.(false);
            }
        });
        closeBtn?.addEventListener('click', () => {
            dialog._resolve?.(false);
        });

        return dialog;
    }

    exposeI18nHelpers();

    function showDialog(message, options) {
        return new Promise(resolve => {
            const dialog = ensureDialog();
            const titleEl = dialog.querySelector('#dl-ui-title');
            const msgEl = dialog.querySelector('#dl-ui-message');
            const okBtn = dialog.querySelector('[data-dialog-ok]');
            const cancelBtn = dialog.querySelector('[data-dialog-cancel]');
            const actions = dialog.querySelector('[data-dialog-actions]');

            const mode = options?.mode || 'alert';
            dialog.dataset.mode = mode;
            dialog._resolve = (result) => {
                dialog._resolve = null;
                okBtn?.removeEventListener('click', okHandler);
                cancelBtn?.removeEventListener('click', cancelHandler);
                setModalState(dialog, false);
                resolve(!!result);
            };

            const okHandler = () => dialog._resolve?.(true);
            const cancelHandler = () => dialog._resolve?.(false);

            okBtn?.addEventListener('click', okHandler);
            cancelBtn?.addEventListener('click', cancelHandler);

            if (titleEl) titleEl.textContent = options?.title || (mode === 'confirm' ? t('ui_confirm_title', 'Please confirm') : t('ui_alert_title', 'Notice'));
            if (msgEl) msgEl.textContent = message || '';
            if (okBtn) okBtn.textContent = options?.confirmText || t('ui_ok', 'OK');

            if (mode === 'confirm') {
                if (cancelBtn) cancelBtn.textContent = options?.cancelText || t('ui_cancel', 'Cancel');
                actions?.classList.remove('hidden');
                cancelBtn?.classList.remove('hidden');
            } else {
                if (cancelBtn) cancelBtn.textContent = '';
                cancelBtn?.classList.add('hidden');
            }

            setModalState(dialog, true, { focusSelector: '[data-dialog-ok]' });
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeTopModal();
        }
    });

    window.DLUI = {
        toggleModal(id, options) {
            const modal = document.getElementById(id);
            setModalState(modal, undefined, options);
        },
        openModal(id, options) {
            const modal = document.getElementById(id);
            setModalState(modal, true, options);
        },
        closeModal(id) {
            const modal = document.getElementById(id);
            setModalState(modal, false);
        },
        alert(message, options) {
            return showDialog(message, { ...options, mode: 'alert' });
        },
        confirm(message, options) {
            return showDialog(message, { ...options, mode: 'confirm' });
        }
    };
})();
