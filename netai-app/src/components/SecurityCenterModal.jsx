import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Fingerprint, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Trash2, 
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { 
  toggle2FA, 
  changePassword, 
  deleteAccount, 
  logoutUser, 
  checkPasswordStrength, 
  generateTOTPCode 
} from '../security/authService';

export default function SecurityCenterModal({ isOpen, onClose, user, onLogout, onAccountDeleted }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'password'
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.enable2FA || false);
  const [totpSim, setTotpSim] = useState(null);

  // Change password form state with independent visibility toggles
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Confirm delete modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIs2FAEnabled(user?.enable2FA || false);
      if (user?.enable2FA) {
        setTotpSim(generateTOTPCode(user?.twoFactorSecret || 'NETAI_SEC'));
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const strength = checkPasswordStrength(newPass);

  const handleToggle2FA = () => {
    const nextState = !is2FAEnabled;
    toggle2FA(user.id, nextState);
    setIs2FAEnabled(nextState);
    if (nextState) {
      setTotpSim(generateTOTPCode(user?.twoFactorSecret || 'NETAI_SEC'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!strength.isValid) {
      setPassError('La nueva contraseña debe tener mínimo 8 caracteres con mayúscula y número.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmittingPass(true);
    try {
      await changePassword(user.id, currentPass, newPass);
      setPassSuccess('¡Contraseña actualizada con éxito y cifrada!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setPassError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleDeleteAccount = () => {
    deleteAccount(user.id);
    onAccountDeleted();
    onClose();
  };

  return (
    <div className="security-modal-overlay fade-in" onClick={onClose}>
      <div 
        className="security-modal-card glass-panel" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-modal-title"
      >
        {/* Modal Header */}
        <div className="sec-modal-header">
          <div className="d-flex align-center gap-3">
            <div className="sec-icon-circle">
              <ShieldCheck size={22} className="text-emerald" />
            </div>
            <div>
              <h3 id="security-modal-title" className="sec-modal-title">
                Centro de Ciberseguridad
              </h3>
              <p className="sec-modal-subtitle">
                Protección criptográfica y control de cuenta
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="modal-close-btn" 
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Subtabs (Clean 2-Option Pill Switcher) */}
        <div className="security-subtabs">
          <button 
            type="button" 
            className={`sec-subtab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Estado de Seguridad
          </button>
          <button 
            type="button" 
            className={`sec-subtab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Cambiar Contraseña
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="modal-body-scrollable">
          {/* TAB 1: ESTADO DE SEGURIDAD */}
          {activeTab === 'overview' && (
            <div className="sec-overview-content fade-in">
              {/* Account Info Card */}
              <div className="sec-card-box">
                <div className="sec-box-header">
                  <span className="sec-box-title">Identidad del Usuario</span>
                  <span className="sec-status-badge active">Sesión Autenticada</span>
                </div>
                <div className="sec-user-details mt-2">
                  <p><strong>Usuario:</strong> {user?.name || 'Atleta'}</p>
                  <p><strong>Correo electrónico:</strong> {user?.email}</p>
                  <p><strong>Algoritmo de Hash:</strong> PBKDF2-HMAC-SHA256 (100,000 rondas)</p>
                  <p><strong>Protección Anti-Fuerza Bruta:</strong> Activa (Límite 5 intentos)</p>
                </div>
              </div>

              {/* 2FA Toggle Box */}
              <div className="sec-card-box mt-3">
                <div className="d-flex justify-between align-center">
                  <div className="d-flex align-center gap-3">
                    <Fingerprint size={24} className={is2FAEnabled ? 'text-emerald' : 'text-secondary'} />
                    <div>
                      <h4 className="sec-box-title">Autenticación en 2 Pasos (2FA)</h4>
                      <p className="sec-box-desc">
                        {is2FAEnabled 
                          ? 'Activada: Requiere código TOTP de 6 dígitos para iniciar sesión.'
                          : 'Desactivada: Activa 2FA para blindar tu cuenta contra accesos no autorizados.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleToggle2FA}
                    className={`toggle-switch ${is2FAEnabled ? 'active' : ''}`}
                    aria-label="Alternar 2FA"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>

                {is2FAEnabled && totpSim && (
                  <div className="totp-demo-pill mt-3">
                    <span className="totp-label">Código TOTP actual:</span>
                    <strong className="totp-code">{totpSim.code}</strong>
                    <span className="totp-timer">Expira en {totpSim.secondsRemaining}s</span>
                  </div>
                )}
              </div>

              {/* Danger Zone: Session Logout & Delete */}
              <div className="sec-danger-zone mt-4">
                <h4 className="danger-zone-title">Gestión de Sesión y Datos</h4>
                <div className="danger-zone-actions mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      logoutUser();
                      onLogout();
                      onClose();
                    }}
                    className="btn-secondary sec-logout-btn"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión Segura</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-danger-outline"
                  >
                    <Trash2 size={16} />
                    <span>Eliminar Cuenta y Purgar Datos (GDPR)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMBIAR CONTRASEÑA (Polished full-width form) */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="sec-password-form fade-in">
              {passError && (
                <div className="auth-alert-banner error mb-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="auth-alert-banner success mb-2">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {/* 1. Contraseña Actual */}
              <div className="sec-input-group">
                <label className="sec-field-label">Contraseña Actual</label>
                <div className="sec-input-box">
                  <Lock size={18} className="sec-input-icon" />
                  <input 
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                    placeholder="Ingresa tu contraseña actual"
                    className="sec-input-control"
                    autoComplete="current-password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="sec-toggle-visibility-btn"
                    aria-label={showCurrentPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 2. Nueva Contraseña */}
              <div className="sec-input-group">
                <div className="sec-field-label">
                  <span>Nueva Contraseña</span>
                  {newPass && (
                    <span 
                      className="sec-strength-badge" 
                      style={{ 
                        color: strength.color, 
                        backgroundColor: `${strength.color}18` 
                      }}
                    >
                      {strength.label} ({strength.score}%)
                    </span>
                  )}
                </div>
                <div className="sec-input-box">
                  <Key size={18} className="sec-input-icon" />
                  <input 
                    type={showNewPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres (mayúscula y número)"
                    className="sec-input-control"
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="sec-toggle-visibility-btn"
                    aria-label={showNewPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {newPass && (
                  <div className="sec-strength-track">
                    <div 
                      className="sec-strength-fill"
                      style={{ 
                        width: `${strength.score}%`, 
                        backgroundColor: strength.color 
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 3. Confirmar Nueva Contraseña */}
              <div className="sec-input-group">
                <div className="sec-field-label">
                  <span>Confirmar Nueva Contraseña</span>
                  {confirmPass && newPass === confirmPass && (
                    <span className="sec-match-tag">
                      <CheckCircle2 size={13} />
                      Coincide
                    </span>
                  )}
                </div>
                <div className="sec-input-box">
                  <Key size={18} className="sec-input-icon" />
                  <input 
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    placeholder="Repite la nueva contraseña"
                    className="sec-input-control"
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="sec-toggle-visibility-btn"
                    aria-label={showConfirmPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-primary sec-submit-pass-btn"
                disabled={isSubmittingPass || !strength.isValid || newPass !== confirmPass}
              >
                <ShieldCheck size={18} />
                <span>{isSubmittingPass ? 'Guardando nueva contraseña...' : 'Actualizar Contraseña'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Delete Account Modal Confirmation */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box glass-panel">
              <AlertTriangle size={32} className="text-red" />
              <h3>¿Eliminar cuenta definitivamente?</h3>
              <p>
                Esta acción es irreversible bajo el protocolo GDPR. Se purgarán todas tus comidas, pesos, métricas y claves criptográficas de este navegador.
              </p>
              <div className="d-flex gap-2 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteAccount}
                  className="btn-danger"
                >
                  Sí, purgar todo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
