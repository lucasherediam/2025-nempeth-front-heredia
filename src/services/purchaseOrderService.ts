import api from './api'

// Enums
export type PurchaseOrderStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED'

// Interfaces para request
export interface PurchaseOrderItemRequest {
    productId: string
    quantity: number
    unitCost: number
}

export interface CreatePurchaseOrderRequest {
    supplierName: string
    items: PurchaseOrderItemRequest[]
}

// Interfaces para response
export interface PurchaseOrderListItem {
    id: string
    supplierName: string
    status: PurchaseOrderStatus
    createdAt: string
    receivedAt: string | null
    itemCount: number
    totalAmount: number
}

export interface PurchaseOrderItem {
    id: string
    productId: string
    productName: string
    quantity: number
    unitCost: number
    totalCost: number
}

export interface PurchaseOrderDetail {
    id: string
    supplierName: string
    status: PurchaseOrderStatus
    createdAt: string
    receivedAt: string | null
    cancelledAt: string | null
    items: PurchaseOrderItem[]
    totalAmount: number
}

export const purchaseOrderService = {
    // Crear orden de compra
    createPurchaseOrder: async (
        businessId: string,
        data: CreatePurchaseOrderRequest
    ): Promise<{ purchaseOrderId: string }> => {
        const response = await api.post(
            `/businesses/${businessId}/purchase-orders`,
            data
        )
        return response.data
    },

    // Listar órdenes de compra
    getPurchaseOrders: async (businessId: string): Promise<PurchaseOrderListItem[]> => {
        const response = await api.get(`/businesses/${businessId}/purchase-orders`)
        return response.data
    },

    // Obtener detalle de orden
    getPurchaseOrderById: async (
        businessId: string,
        purchaseOrderId: string
    ): Promise<PurchaseOrderDetail> => {
        const response = await api.get(
            `/businesses/${businessId}/purchase-orders/${purchaseOrderId}`
        )
        return response.data
    },

    // Recibir orden
    receivePurchaseOrder: async (
        businessId: string,
        purchaseOrderId: string
    ): Promise<void> => {
        await api.patch(
            `/businesses/${businessId}/purchase-orders/${purchaseOrderId}/receive`
        )
    },

    // Cancelar orden
    cancelPurchaseOrder: async (
        businessId: string,
        purchaseOrderId: string
    ): Promise<void> => {
        await api.patch(
            `/businesses/${businessId}/purchase-orders/${purchaseOrderId}/cancel`
        )
    }
}
