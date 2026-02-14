import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import LoadingScreen from '../components/LoadingScreen'
import { purchaseOrderService, type PurchaseOrderDetail, type PurchaseOrderStatus } from '../services/purchaseOrderService'
import {
    IoArrowBackOutline,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoReceiptOutline,
    IoCalendarOutline,
    IoPersonOutline
} from 'react-icons/io5'

function PurchaseOrderDetails() {
    const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [order, setOrder] = useState<PurchaseOrderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user?.businessId && purchaseOrderId) {
            loadOrderDetails()
        }
    }, [user?.businessId, purchaseOrderId])

    const loadOrderDetails = async () => {
        if (!user?.businessId || !purchaseOrderId) return

        try {
            setLoading(true)
            setError(null)
            const data = await purchaseOrderService.getPurchaseOrderById(
                user.businessId,
                purchaseOrderId
            )
            setOrder(data)
        } catch (err) {
            console.error('Error loading order details:', err)
            setError('Error al cargar los detalles de la orden')
        } finally {
            setLoading(false)
        }
    }

    const handleReceiveOrder = async () => {
        if (!user?.businessId || !purchaseOrderId || !order) return

        if (!confirm('¿Estás seguro de marcar esta orden como recibida? Esta acción actualizará el stock de los productos y no se puede deshacer.')) {
            return
        }

        try {
            setProcessing(true)
            await purchaseOrderService.receivePurchaseOrder(user.businessId, purchaseOrderId)
            await loadOrderDetails()
        } catch (err) {
            console.error('Error receiving order:', err)
            alert('Error al recibir la orden. Por favor intenta nuevamente.')
        } finally {
            setProcessing(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!user?.businessId || !purchaseOrderId || !order) return

        if (!confirm('¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            setProcessing(true)
            await purchaseOrderService.cancelPurchaseOrder(user.businessId, purchaseOrderId)
            await loadOrderDetails()
        } catch (err) {
            console.error('Error cancelling order:', err)
            alert('Error al cancelar la orden. Por favor intenta nuevamente.')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusBadge = (status: PurchaseOrderStatus) => {
        const badges = {
            PENDING: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                border: 'border-yellow-200',
                label: 'Pendiente',
                icon: '🟡'
            },
            RECEIVED: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                border: 'border-green-200',
                label: 'Recibida',
                icon: '🟢'
            },
            CANCELLED: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                border: 'border-red-200',
                label: 'Cancelada',
                icon: '🔴'
            }
        }
        const badge = badges[status]
        return (
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                <span>{badge.icon}</span>
                {badge.label}
            </span>
        )
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount)
    }

    if (loading) {
        return <LoadingScreen />
    }

    if (error || !order) {
        return (
            <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="mx-auto max-w-4xl">
                    <div className="p-8 text-center bg-white rounded-2xl shadow-sm">
                        <div className="mb-4 text-6xl">⚠️</div>
                        <h2 className="mb-2 text-2xl font-bold text-gray-900">Error</h2>
                        <p className="mb-6 text-gray-600">{error || 'No se pudo cargar la orden'}</p>
                        <button
                            onClick={() => navigate('/purchase-orders')}
                            className="px-6 py-2 text-white bg-[#f74116] rounded-lg hover:bg-[#d63912] transition-colors"
                        >
                            Volver a Órdenes
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/purchase-orders')}
                        className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-6 hover:bg-[#f74116]/20 transition-colors group"
                    >
                        <IoArrowBackOutline className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Volver a Órdenes</span>
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-2">
                            Orden #{order.id.substring(0, 8).toUpperCase()}
                        </h1>
                        <p className="text-gray-600">Detalles completos de la orden de compra</p>
                    </div>
                </div>

                {/* Order Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6 mb-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#f74116]/10 to-[#f74116]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <IoReceiptOutline className="w-8 h-8 text-[#f74116]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Resumen de la Orden</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <IoPersonOutline className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <span className="text-gray-600 font-medium">Proveedor: </span>
                                            <span className="text-gray-900">{order.supplierName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <IoCalendarOutline className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <span className="text-gray-600 font-medium">Fecha: </span>
                                            <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center lg:items-end gap-3">
                            {getStatusBadge(order.status)}
                            <div className="text-center lg:text-right">
                                <p className="text-sm text-gray-600 mb-1">Total de la orden</p>
                                <div className="text-3xl font-bold text-[#f74116]">
                                    {formatCurrency(order.totalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Detail Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6 hover:shadow-lg transition-all duration-200 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                            <IoReceiptOutline className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Productos</h2>
                            <p className="text-sm text-gray-600">
                                {order.items.length} producto{order.items.length !== 1 ? 's' : ''} en esta orden
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="group p-5 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.productName}</h3>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Cantidad</p>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="text-lg font-bold text-blue-600">{item.quantity}</span>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Costo Unit.</p>
                                            <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                                                <span className="text-sm font-bold text-orange-600">
                                                    {formatCurrency(item.unitCost)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Subtotal</p>
                                            <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                                <span className="text-sm font-bold text-green-600">
                                                    {formatCurrency(item.totalCost)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                {order.status === 'PENDING' && (
                    <div className="flex gap-4">
                        <button
                            onClick={handleCancelOrder}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold text-red-600 bg-white border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoCloseCircle className="w-5 h-5" />
                            {processing ? 'Procesando...' : 'Cancelar Orden'}
                        </button>
                        <button
                            onClick={handleReceiveOrder}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoCheckmarkCircle className="w-5 h-5" />
                            {processing ? 'Procesando...' : 'Marcar como Recibida'}
                        </button>
                    </div>
                )}

                {order.status !== 'PENDING' && (
                    <div className="p-6 text-center bg-gray-100 rounded-lg">
                        <p className="text-gray-600 font-medium">
                            {order.status === 'RECEIVED' && '✅ Esta orden ya fue recibida y el stock fue actualizado.'}
                            {order.status === 'CANCELLED' && '❌ Esta orden fue cancelada.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PurchaseOrderDetails
