/**
 * i18n.js - Simple Internationalization System
 * Requires translations.js to be loaded first.
 */

const i18n = {
    // Priority: LocalStorage -> Browser Language -> Default (KO)
    currentLang: (function () {
        const saved = localStorage.getItem('deeplink_lang');
        if (saved && typeof translations !== 'undefined' && translations[saved]) return saved;

        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('ko')) return 'ko';
        if (browserLang.startsWith('en')) return 'en';
        if (browserLang.startsWith('ja')) return 'ja';
        if (browserLang.startsWith('zh')) return 'zh';
        return 'ko';
    })(),

    getLanguage() {
        return this.currentLang;
    },

    init() {
        this.updateDOM();
        // Delay updateSelector to ensure footer is loaded if it's dynamic (though here it's static)
        setTimeout(() => this.updateSelector(), 100);
    },

    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('deeplink_lang', lang);
            this.updateDOM();
            this.updateSelector();

            // Dispatch custom event for parts of the page that might need manual update
            const event = new CustomEvent('languageChanged', { detail: { language: lang } });
            window.dispatchEvent(event);
            document.dispatchEvent(event);

            console.log(`Language switched to: ${lang}`);
        }
    },

    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attrMatch = key.match(/^\[(.+?)\](.+)$/);
            const translationKey = attrMatch ? attrMatch[2] : key;
            const translation = translations[this.currentLang]
                ? translations[this.currentLang][translationKey]
                : null;

            if (translation !== null && translation !== undefined) {
                if (attrMatch) {
                    const attrName = attrMatch[1];
                    if (attrName === 'html') {
                        el.innerHTML = translation;
                    } else if (attrName === 'text') {
                        el.textContent = translation;
                    } else {
                        el.setAttribute(attrName, translation);
                    }
                    return;
                }

                // Check if it's an input/textarea for placeholder
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.innerHTML = translation;
                }
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Update page title if specific meta key exists
        const pageName = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        const titleKey = `title_${pageName}`;
        if (translations[this.currentLang][titleKey]) {
            document.title = translations[this.currentLang][titleKey];
        }

        // Update meta tags (description, keywords)
        const descKey = `meta_desc_${pageName}`;
        if (translations[this.currentLang][descKey]) {
            const meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute('content', translations[this.currentLang][descKey]);
        }

        const keywordsKey = `meta_keywords_${pageName}`;
        if (translations[this.currentLang][keywordsKey]) {
            const meta = document.querySelector('meta[name="keywords"]');
            if (meta) meta.setAttribute('content', translations[this.currentLang][keywordsKey]);
        }

        // 中文界面隐藏公司注册信息(公司名/UEN/地址)及其分隔符 | ；其他语言正常显示。
        // (boss 2026-06-16：中文界面去掉这段，其他语言保留。在每次切换语言时重算，故切回其他语言会恢复显示。)
        const companyKeys = ['footer_company_name', 'footer_company_uen', 'footer_address'];
        const hideCompany = this.currentLang === 'zh';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (!companyKeys.includes(el.getAttribute('data-i18n'))) return;
            el.style.display = hideCompany ? 'none' : '';
            // 紧跟其后的分隔符 span（文本仅为 "|"）一并隐藏/恢复，避免留下孤立的竖线
            const sep = el.nextElementSibling;
            if (sep && sep.textContent.trim() === '|') sep.style.display = hideCompany ? 'none' : '';
        });
    },

    updateSelector() {
        const selectors = document.querySelectorAll('.lang-selector');
        selectors.forEach(sel => {
            sel.value = this.currentLang;
        });
    }
};

// Initial run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}
