import api from './api';

export interface BusinessMemberDetailResponse {
  userId: string;
  userEmail: string;
  userName: string;
  userLastName: string;
  role: string;
  status: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  categoryId: string;
}

export interface BusinessStatsResponse {
  totalProducts: number;
  totalCategories: number;
  totalMembers: number;
}

export interface BusinessDetailResponse {
  id: string;
  name: string;
  joinCode: string;
  joinCodeEnabled: boolean;
  members: BusinessMemberDetailResponse[];
  categories: CategoryResponse[];
  products: ProductResponse[];
  stats: BusinessStatsResponse;
}

export const businessService = {
  getBusinessDetail: async (
    businessId: string,
  ): Promise<BusinessDetailResponse> => {
    try {
      const response = await api.get(`/businesses/${businessId}/detail`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles del negocio:', error);
      throw error;
    }
  },

  getBusinessEmployees: async (
    businessId: string,
  ): Promise<BusinessMemberDetailResponse[]> => {
    try {
      const response = await api.get(`/businesses/${businessId}/employees`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener empleados del negocio:', error);
      throw error;
    }
  },

  updateMemberStatus: async (
    businessId: string,
    userId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING',
  ): Promise<void> => {
    try {
      await api.put(
        `/users/businesses/${businessId}/members/${userId}/status`,
        { status },
      );
    } catch (error) {
      console.error('Error al actualizar estado del empleado:', error);
      throw error;
    }
  },
};
