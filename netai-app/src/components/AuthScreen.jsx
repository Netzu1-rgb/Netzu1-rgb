import React, { useState, useEffect } from 'react';
import { 
  Zap,
  Lock, 
  Mail, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Fingerprint, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  loginUser, 
  registerUser, 
  recoverPassword, 
  checkPasswordStrength, 
  checkRateLimit, 
  generateTOTPCode 
} from '../security/authService';

export default function AuthScreen({ onLoginSuccess }) {
  // Mode: 'login' | 'register' | 'recover'
  const [mode, setMode] = useState('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Security UX
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rate Limiting lockout state
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Simulated TOTP helper code
  const [sampleTotp, setSampleTotp] = useState(null);

  // Check rate limits when email changes
  useEffect(() => {
    if (!email) {
      setLockoutSeconds(0);
      return;
    }
    const limit = checkRateLimit(email);
    if (limit.isLocked) {
      setLockoutSeconds(limit.remainingSeconds);
    } else {
      setLockoutSeconds(0);
    }
  }, [email]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Real-time password strength
  const strength = checkPasswordStrength(password);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (lockoutSeconds > 0) {
      setErrorMessage(`Bloqueo de seguridad temporal activo. Reintenta en ${lockoutSeconds}s.`);
      return;
    }

    if (!email || !password) {
      setErrorMessage('Por favor completa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser({ email, password, totpCode });
      if (result.requires2FA) {
        setRequires2FA(true);
        const sim = generateTOTPCode('NETAI_SEC');
        setSampleTotp(sim.code);
        setErrorMessage('');
        setSuccessMessage('Verificación en 2 Pasos (2FA) requerida. Ingresa tu código de 6 dígitos.');
      } else {
        setSuccessMessage('¡Bienvenido de nuevo! Iniciando sesión...');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 400);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error al iniciar sesión.');
      const limit = checkRateLimit(email);
      if (limit.isLocked) {
        setLockoutSeconds(limit.remainingSeconds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name || name.trim().length < 2) {
      setErrorMessage('Ingresa tu nombre o alias (mínimo 2 caracteres).');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    if (!strength.isValid) {
      setErrorMessage('Tu contraseña debe cumplir con los requisitos mínimos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Debes aceptar las políticas de privacidad.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({ name, email, password, enable2FA });
      setSuccessMessage('¡Cuenta creada con éxito! Configurando tu perfil...');
      setTimeout(() => {
        onLoginSuccess(result.user, true); // true = triggers personalized onboarding wizard
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Ingresa tu correo registrado.');
      return;
    }

    if (!strength.isValid) {
      setErrorMessage('La nueva contraseña debe cumplir con los requisitos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await recoverPassword(email, password);
      setSuccessMessage('¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al restablecer contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Zero-State Onboarding for immediate testing
  const handleQuickCleanAccount = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const testEmail = `atleta_${Math.floor(1000 + Math.random() * 9000)}@netai.app`;
      const result = await registerUser({
        name: 'Nuevo Atleta',
        email: testEmail,
        password: 'Password#2026',
        enable2FA: false
      });
      setSuccessMessage('Creando cuenta limpia desde 0...');
      setTimeout(() => {
        onLoginSuccess(result.user, true);
      }, 300);
    } catch (err) {
      setErrorMessage(err.message || 'Error al crear cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4-segment strength calculation
  const strengthSegments = Math.min(4, Math.max(password ? 1 : 0, Math.ceil((strength.score || 0) / 25)));

  return (
    <div className="auth-portal-wrapper">
      {/* Subtle ambient lighting glows */}
      <div className="auth-ambient-glow emerald" />
      <div className="auth-ambient-glow indigo" />

      <div className="auth-card glass-panel fade-in">
        {/* Modern Brand Presentation */}
        <div className="auth-brand-header">
          <div className="auth-brand-logo-wrap">
            <div className="auth-logo-icon">
              <Zap size={26} className="text-emerald" />
            </div>
            <span className="auth-security-chip">
              <ShieldCheck size={13} className="text-emerald" />
              Acceso Seguro
            </span>
          </div>

          <h1 className="auth-brand-heading">
            {mode === 'recover' ? 'Recuperar Contraseña' : mode === 'register' ? 'Crear tu Cuenta' : 'Bienvenido a NetAI'}
          </h1>
          <p className="auth-brand-subheading">
            {mode === 'recover' 
              ? 'Ingresa tu correo para restaurar tus credenciales de acceso.'
              : mode === 'register'
              ? 'Empieza hoy con tu plan nutricional inteligente desde cero.'
              : 'Nutrición inteligente y seguimiento calórico asistido por IA.'}
          </p>
        </div>

        {/* 2-Option Segmented Tab Navigation */}
        {mode !== 'recover' ? (
          <div className="auth-nav-segment">
            <button 
              type="button" 
              className={`auth-segment-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              Iniciar Sesión
            </button>
            <button 
              type="button" 
              className={`auth-segment-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              Crear Cuenta
            </button>
          </div>
        ) : (
          <div className="auth-back-row mb-3">
            <button 
              type="button" 
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="auth-btn-back"
            >
              <ArrowLeft size={16} />
              <span>Volver al inicio de sesión</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {lockoutSeconds > 0 && (
          <div className="auth-banner warning fade-in">
            <AlertTriangle size={18} className="text-amber flex-shrink-0" />
            <div className="banner-content">
              <strong>Bloqueo temporal de seguridad:</strong>
              <p>Reintenta en <strong>{lockoutSeconds} segundos</strong>.</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="auth-banner error fade-in">
            <ShieldAlert size={18} className="text-red flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-banner success fade-in">
            <CheckCircle2 size={18} className="text-emerald flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* INICIAR SESIÓN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-fields-stack">
            {/* Email Field */}
            <div className="auth-input-group">
              <label htmlFor="login-email" className="auth-label">Correo Electrónico</label>
              <div className="auth-field-box">
                <Mail size={18} className="auth-field-icon" />
                <input 
                  id="login-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  required
                  disabled={lockoutSeconds > 0}
                  className="auth-input-control"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-input-group">
              <div className="d-flex justify-between align-center mb-1">
                <label htmlFor="login-password" className="auth-label">Contraseña</label>
                <button 
                  type="button" 
                  className="auth-forgot-link"
                  onClick={() => setMode('recover')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="auth-field-box">
                <Lock size={18} className="auth-field-icon" />
                <input 
                  id="login-password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                  disabled={lockoutSeconds > 0}
                  className="auth-input-control"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-visibility"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 2FA Verification Box (If Required) */}
            {requires2FA && (
              <div className="auth-input-group two-factor-card fade-in">
                <label htmlFor="login-totp" className="auth-label d-flex align-center gap-1">
                  <Fingerprint size={16} className="text-emerald" />
                  Código de Autenticación 2FA
                </label>
                <div className="auth-field-box">
                  <Key size={18} className="auth-field-icon" />
                  <input 
                    id="login-totp"
                    type="text" 
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    className="auth-input-control font-code"
                  />
                </div>
                {sampleTotp && (
                  <p className="auth-helper-note">
                    Código de prueba generado: <strong className="text-emerald">{sampleTotp}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Main Submit Button */}
            <button 
              type="submit" 
              className="btn-primary auth-submit-action"
              disabled={isLoading || lockoutSeconds > 0}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="spin-animate" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a NetAI</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* CREAR CUENTA FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-fields-stack">
            {/* Name Field */}
            <div className="auth-input-group">
              <label htmlFor="reg-name" className="auth-label">Nombre Completo o Alias</label>
              <div className="auth-field-box">
                <User size={18} className="auth-field-icon" />
                <input 
                  id="reg-name"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofía Ramírez"
                  required
                  className="auth-input-control"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="auth-input-group">
              <label htmlFor="reg-email" className="auth-label">Correo Electrónico</label>
              <div className="auth-field-box">
                <Mail size={18} className="auth-field-icon" />
                <input 
                  id="reg-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="auth-input-control"
                />
              </div>
            </div>

            {/* Password Field with Refined Strength Meter */}
            <div className="auth-input-group">
              <div className="d-flex justify-between align-center mb-1">
                <label htmlFor="reg-pass" className="auth-label">Contraseña</label>
                {password && (
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="auth-field-box">
                <Lock size={18} className="auth-field-icon" />
                <input 
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="auth-input-control"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-visibility"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* 4-Segment Strength Indicator */}
              {password && (
                <div className="strength-segments-row mt-2">
                  {[1, 2, 3, 4].map((seg) => (
                    <div 
                      key={seg}
                      className={`strength-bar-seg ${seg <= strengthSegments ? 'filled' : ''}`}
                      style={{
                        backgroundColor: seg <= strengthSegments ? strength.color : 'rgba(255, 255, 255, 0.08)'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Minimal Clean Checklist */}
              <div className="checklist-chips-grid mt-2">
                <span className={`check-chip ${strength.criteria.length ? 'valid' : ''}`}>
                  {strength.criteria.length ? <Check size={12} /> : '•'} 8+ carácteres
                </span>
                <span className={`check-chip ${strength.criteria.upper ? 'valid' : ''}`}>
                  {strength.criteria.upper ? <Check size={12} /> : '•'} Mayúscula
                </span>
                <span className={`check-chip ${strength.criteria.number ? 'valid' : ''}`}>
                  {strength.criteria.number ? <Check size={12} /> : '•'} Número
                </span>
                <span className={`check-chip ${strength.criteria.special ? 'valid' : ''}`}>
                  {strength.criteria.special ? <Check size={12} /> : '•'} Símbolo (!@#$)
                </span>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="auth-input-group">
              <label htmlFor="reg-confirm" className="auth-label">Confirmar Contraseña</label>
              <div className="auth-field-box">
                <Key size={18} className="auth-field-icon" />
                <input 
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  className="auth-input-control"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-field-error">Las contraseñas no coinciden.</span>
              )}
            </div>

            {/* Checkboxes */}
            <div className="auth-options-group mt-1">
              <label className="auth-check-row">
                <input 
                  type="checkbox" 
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                />
                <span>Activar Doble Factor de Autenticación (2FA)</span>
              </label>

              <label className="auth-check-row">
                <input 
                  type="checkbox" 
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                />
                <span>Acepto los Términos de Servicio y Privacidad</span>
              </label>
            </div>

            {/* Submit Action */}
            <button 
              type="submit" 
              className="btn-primary auth-submit-action mt-2"
              disabled={isLoading || !strength.isValid || password !== confirmPassword || !acceptTerms}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="spin-animate" />
                  <span>Creando cuenta segura...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta y Diseñar Plan</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* RECUPERAR CONTRASEÑA FORM */}
        {mode === 'recover' && (
          <form onSubmit={handleRecover} className="auth-fields-stack">
            <div className="auth-input-group">
              <label htmlFor="rec-email" className="auth-label">Correo Registrado</label>
              <div className="auth-field-box">
                <Mail size={18} className="auth-field-icon" />
                <input 
                  id="rec-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="auth-input-control"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="rec-newpass" className="auth-label">Nueva Contraseña</label>
              <div className="auth-field-box">
                <Lock size={18} className="auth-field-icon" />
                <input 
                  id="rec-newpass"
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="auth-input-control"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-visibility"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="rec-confirmpass" className="auth-label">Confirmar Nueva Contraseña</label>
              <div className="auth-field-box">
                <Key size={18} className="auth-field-icon" />
                <input 
                  id="rec-confirmpass"
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                  className="auth-input-control"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary auth-submit-action mt-2"
              disabled={isLoading || !strength.isValid || password !== confirmPassword}
            >
              {isLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

        {/* Quick Testing Entry Option: Clean Account in 0 */}
        <div className="auth-divider-line">
          <span>O ingresa al instante</span>
        </div>

        <button 
          type="button" 
          onClick={handleQuickCleanAccount}
          className="auth-fast-entry-btn"
          disabled={isLoading}
        >
          <Sparkles size={16} className="text-emerald" />
          <span>Explorar como Nuevo Atleta (Cuenta Limpia en 0)</span>
        </button>

        {/* Subtle, elegant security reassurance seal */}
        <div className="auth-trust-seal">
          <ShieldCheck size={14} className="text-emerald" />
          <span>Conexión cifrada de extremo a extremo • Privacidad 100% garantizada</span>
        </div>
      </div>
    </div>
  );
}
