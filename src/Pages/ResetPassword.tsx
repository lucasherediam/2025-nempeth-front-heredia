import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import korvenLogo from '../assets/Korven_logo.png'
import { AuthService } from '../services/loginService'
import SuccesOperation from '../components/SuccesOperation'
import '../Styles/ResetPassword.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [error, setError] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)

  // Validar token al cargar la página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.log('No se encontró token en la URL')
        setError('Token no encontrado en la URL. Asegúrate de usar el enlace completo del email.')
        setIsValidatingToken(false)
        return
      }

      try {
        const response = await AuthService.validateResetToken(token)
        console.log('Respuesta de validación:', response)
        setTokenValid(true)
      } catch (err) {
        console.error('Error al validar token:', err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Error al validar el token')
        }
      } finally {
        setIsValidatingToken(false)
      }
    }

    validateToken()
  }, [token])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'La contraseña debe contener al menos una letra minúscula'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'La contraseña debe contener al menos un número'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!newPassword.trim()) {
      setError('La nueva contraseña es obligatoria')
      return
    }

    if (!confirmPassword.trim()) {
      setError('Confirma tu nueva contraseña')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (!token) {
      setError('Token no válido')
      return
    }

    setIsLoading(true)

    try {
      const response = await AuthService.resetPassword(token, newPassword)
      console.log('Contraseña restablecida:', response)
      setShowSuccessMessage(true)
    } catch (err) {
      console.error('Error al restablecer contraseña:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error inesperado. Intenta nuevamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessMessage(false)
    navigate('/auth')
  }

  if (isValidatingToken) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="logo-section">
            <img src={korvenLogo} alt="Korven Logo" className="logo" />
          </div>
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Validando token...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="logo-section">
            <img src={korvenLogo} alt="Korven Logo" className="logo" />
          </div>
          <div className="error-section">
            <h2>Token Inválido</h2>
            <p className="error-message">{error}</p>
            <button 
              onClick={() => navigate('/auth')} 
              className="back-button"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="logo-section">
          <img src={korvenLogo} alt="Korven Logo" className="logo" />
        </div>

        <div className="form-section">
          <h2>Restablecer Contraseña</h2>
          <p className="subtitle">Ingresa tu nueva contraseña</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  className={error && !newPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoEyeOff /> : <IoEye />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  className={error && !confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <IoEyeOff /> : <IoEye />}
                </button>
              </div>
            </div>

            <div className="password-requirements">
              <p>La contraseña debe contener:</p>
              <ul>
                <li className={newPassword.length >= 8 ? 'valid' : ''}>
                  Al menos 8 caracteres
                </li>
                <li className={/(?=.*[a-z])/.test(newPassword) ? 'valid' : ''}>
                  Una letra minúscula
                </li>
                <li className={/(?=.*[A-Z])/.test(newPassword) ? 'valid' : ''}>
                  Una letra mayúscula
                </li>
                <li className={/(?=.*\d)/.test(newPassword) ? 'valid' : ''}>
                  Un número
                </li>
              </ul>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-small"></div>
                  Restableciendo...
                </>
              ) : (
                'Restablecer Contraseña'
              )}
            </button>
          </form>

          <div className="back-to-login">
            <button onClick={() => navigate('/auth')} className="link-button">
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <SuccesOperation
          message="¡Contraseña restablecida exitosamente!"
          onClose={handleSuccessClose}
        />
      )}
    </div>
  )
}

export default ResetPassword