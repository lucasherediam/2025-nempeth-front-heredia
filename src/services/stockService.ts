import api from './api';
import { StockUnit } from './productService';

export type StockStatus = 'OK' | 'LOW' | 'BELOW_MIN';

export interface StockItem {
    productId: string;
    productName: string;
    categoryId: string;
    categoryName: string;
    stockQuantity: number;
    stockUnit: StockUnit;
    reorderPoint: number;
    status: StockStatus;
}

export interface UpdateStockRequest {
    stockQuantity: number;
    unit: StockUnit;
    reorderPoint: number;
}

export const stockService = {
    getStock: async (businessId: string): Promise<StockItem[]> => {
        try {
            const response = await api.get(`/businesses/${businessId}/stock`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener stock:', error);
            throw error;
        }
    },

    updateStock: async (
        businessId: string,
        productId: string,
        stockData: UpdateStockRequest,
    ): Promise<void> => {
        try {
            await api.patch(
                `/businesses/${businessId}/products/${productId}/stock`,
                stockData,
            );
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            throw error;
        }
    },
};

export default stockService;
