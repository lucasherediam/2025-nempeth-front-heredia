import api from './api';
import { AxiosError } from 'axios';

// Interfaces para las requests y responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

export interface RegisterRequestByEmployee {
  name: string;
  lastName: string;
  email: string;
  password: string;
  businessJoinCode: string;
}

export interface RegisterRequestByOwner {
  name: string;
  lastName: string;
  email: string;
  password: string;
  businessName: string;
}

export interface RegisterResponse {
  userId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  message: string;
  valid: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// Servicio de autenticación
export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>(
        '/auth/login',
        credentials,
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('Error en login:', error);

      if (error instanceof AxiosError) {
        throw new Error(error.response?.data.error);
      } else {
        throw new Error('Error inesperado en el login. Intenta nuevamente.');
      }
    }
  }

  // Método para register (para uso futuro)
  // static async register(userData: RegisterRequest): Promise<RegisterResponse> {
  //   try {
  //     const response = await api.post<RegisterResponse>(
  //       '/auth/register',
  //       userData,
  //     );
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error en registro:', error);
  //     if (error instanceof AxiosError) {
  //       throw new Error(error.response?.data.error);
  //     } else {
  //       throw new Error('Error inesperado en el registro. Intenta nuevamente.');
  //     }
  //   }
  // }

  // Método para register de Owner
  static async registerByOwner(
    userData: RegisterRequestByOwner,
  ): Promise<RegisterRequestByOwner> {
    try {
      const response = await api.post<RegisterRequestByOwner>(
        '/auth/register/owner',
        userData,
      );
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data.error);
      } else {
        throw new Error('Error inesperado en el registro. Intenta nuevamente.');
      }
    }
  }

  // Método para register de Employee
  static async registerByEmployee(
    userData: RegisterRequestByEmployee,
  ): Promise<RegisterRequestByEmployee> {
    try {
      const response = await api.post<RegisterRequestByEmployee>(
        '/auth/register/employee',
        userData,
      );
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data.error);
      } else {
        throw new Error('Error inesperado en el registro. Intenta nuevamente.');
      }
    }
  }

  static async forgotPassword(
    userData: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    try {
      const response = await api.post<ForgotPasswordResponse>(
        '/auth/password/forgot',
        userData,
      );
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data.error);
      } else {
        throw new Error('Error inesperado. Intenta nuevamente.');
      }
    }
  }

  // Método para logout
  static logout(): void {
    localStorage.removeItem('token');
  }

  // Método para verificar si el usuario está autenticado
  static isAuthenticated(): boolean {
    return localStorage.getItem('token') !== null;
  }

  // Método para obtener el token actual
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método para validar token de restablecimiento
  static async validateResetToken(
    token: string,
  ): Promise<ValidateTokenResponse> {
    try {
      const response = await api.get<ValidateTokenResponse>(
        `auth/password/validate?token=${encodeURIComponent(token)}`,
      );
      return response.data;
    } catch (error) {
      console.error('Error en validación de token:', error);

      if (error instanceof AxiosError) {
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Headers:', error.response?.headers);

        if (error.response?.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        } else if (error.response?.status === 404) {
          throw new Error('Token no encontrado o inválido.');
        } else if (error.response?.status === 410) {
          throw new Error(
            'El token ha expirado. Solicita un nuevo restablecimiento.',
          );
        } else if (error.response?.status === 400) {
          throw new Error('Token inválido.');
        } else if (error.response?.status === 500) {
          throw new Error('Error del servidor. Intenta más tarde.');
        } else if (!error.response) {
          throw new Error('Error de conexión. Verifica tu internet.');
        } else {
          throw new Error(
            `Error ${error.response.status}: ${
              error.response.data?.message || 'Error inesperado'
            }`,
          );
        }
      } else {
        throw new Error('Error inesperado. Intenta nuevamente.');
      }
    }
  }

  // Método para restablecer la contraseña
  static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponse> {
    try {
      const request: ResetPasswordRequest = { token, newPassword };
      // Hacer request sin el header de Authorization para evitar 403
      const response = await api.post<ResetPasswordResponse>(
        'auth/password/reset',
        request,
      );
      return response.data;
    } catch (error) {
      console.error('Error en reset password:', error);

      if (error instanceof AxiosError) {
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);

        if (error.response?.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        } else if (error.response?.status === 404) {
          throw new Error('Token no encontrado o inválido.');
        } else if (error.response?.status === 410) {
          throw new Error(
            'El token ha expirado. Solicita un nuevo restablecimiento.',
          );
        } else if (error.response?.status === 400) {
          throw new Error(
            'Datos inválidos. Verifica que la contraseña cumpla los requisitos.',
          );
        } else if (error.response?.status === 500) {
          throw new Error('Error del servidor. Intenta más tarde.');
        } else if (!error.response) {
          throw new Error('Error de conexión. Verifica tu internet.');
        } else {
          throw new Error(
            `Error ${error.response.status}: ${
              error.response.data?.message || 'Error inesperado'
            }`,
          );
        }
      } else {
        throw new Error('Error inesperado. Intenta nuevamente.');
      }
    }
  }
}
