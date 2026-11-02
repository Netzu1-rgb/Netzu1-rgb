import React, { useState, useMemo } from 'react';
import { Search, Check, Globe, X, Smartphone, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function LanguageModal({ isOpen, onClose }) {
  const { lang, setLang, languages, t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLanguages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return languages;
    return languages.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.nativeName.toLowerCase().includes(term) ||
      l.code.toLowerCase().includes(term)
    );
  }, [searchTerm, languages]);

  if (!isOpen) return null;

  const handleSelectLanguage = (code) => {
    setLang(code);
    onClose();
  };

  const handleUseDeviceLanguage = () => {
    const navLang = navigator.language || navigator.userLanguage || 'es';
    const match = languages.find(l => navLang.startsWith(l.code) || l.code === navLang);
    if (match) {
      setLang(match.code);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="language-modal-card glass-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="language-modal-header">
          <div className="d-flex align-center gap-2">
            <div className="language-icon-badge">
              <Globe size={20} className="text-emerald" />
            </div>
            <div>
              <h3 className="m-0" style={{ fontSize: '1.2rem' }}>{t('profile.language')}</h3>
              <p className="text-secondary m-0" style={{ fontSize: '0.82rem' }}>
                {t('profile.languageDesc')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Device Language Quick Option */}
        <div className="device-lang-option" onClick={handleUseDeviceLanguage}>
          <div className="d-flex align-center gap-2">
            <Smartphone size={18} className="text-secondary" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t('profile.deviceLanguage')}</span>
          </div>
          <span className="device-lang-tag">Auto</span>
        </div>

        {/* Search Input */}
        <div className="language-search-box">
          <Search size={16} className="text-secondary" />
          <input
            type="text"
            className="language-search-input"
            placeholder={t('profile.searchLanguage')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="btn-clear-search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Languages List */}
        <div className="languages-scroll-list">
          {filteredLanguages.length === 0 ? (
            <div className="no-lang-results">
              <p className="text-secondary">{t('meals.noSearchResults')}</p>
            </div>
          ) : (
            filteredLanguages.map((l) => {
              const isSelected = l.code === lang;
              return (
                <div
                  key={l.code}
                  className={`language-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectLanguage(l.code)}
                >
                  <div className="lang-info-col">
                    <span className="lang-native-name">{l.nativeName}</span>
                    <span className="lang-intl-name">{l.name} • {l.code}</span>
                  </div>
                  {isSelected && (
                    <div className="lang-check-badge">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
