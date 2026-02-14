import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import LoadingScreen from '../components/LoadingScreen'
import { purchaseOrderService, type PurchaseOrderListItem, type PurchaseOrderStatus } from '../services/purchaseOrderService'
import {
    IoReceiptOutline,
    IoCalendarOutline,
    IoCashOutline,
    IoEyeOutline,
    IoAddCircleOutline,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoSwapVerticalOutline
} from 'react-icons/io5'

type SortField = 'date' | 'amount'
type SortOrder = 'asc' | 'desc'

function PurchaseOrders() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL')
    const [processing, setProcessing] = useState<string | null>(null)
    const [sortField, setSortField] = useState<SortField>('date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    useEffect(() => {
        if (user?.businessId) {
            loadPurchaseOrders()
        }
    }, [user?.businessId])

    const loadPurchaseOrders = async () => {
        if (!user?.businessId) return

        try {
            setLoading(true)
            setError(null)
            const data = await purchaseOrderService.getPurchaseOrders(user.businessId)
            setPurchaseOrders(data)
        } catch (err) {
            console.error('Error loading purchase orders:', err)
            setError('Error al cargar las órdenes de compra')
        } finally {
            setLoading(false)
        }
    }

    const handleReceiveOrder = async (orderId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (!user?.businessId) return

        if (!confirm('¿Estás seguro de marcar esta orden como recibida? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            setProcessing(orderId)
            await purchaseOrderService.receivePurchaseOrder(user.businessId, orderId)
            await loadPurchaseOrders()
        } catch (err) {
            console.error('Error receiving order:', err)
            alert('Error al recibir la orden. Por favor intenta nuevamente.')
        } finally {
            setProcessing(null)
        }
    }

    const handleCancelOrder = async (orderId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (!user?.businessId) return

        if (!confirm('¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            setProcessing(orderId)
            await purchaseOrderService.cancelPurchaseOrder(user.businessId, orderId)
            await loadPurchaseOrders()
        } catch (err) {
            console.error('Error cancelling order:', err)
            alert('Error al cancelar la orden. Por favor intenta nuevamente.')
        } finally {
            setProcessing(null)
        }
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const getFilteredAndSortedOrders = () => {
        let filtered = [...purchaseOrders]

        // Filter by status
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortField === 'date') {
                const dateA = new Date(a.createdAt).getTime()
                const dateB = new Date(b.createdAt).getTime()
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
            } else {
                return sortOrder === 'asc'
                    ? a.totalAmount - b.totalAmount
                    : b.totalAmount - a.totalAmount
            }
        })

        return filtered
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
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                <span>{badge.icon}</span>
                {badge.label}
            </span>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
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
        return <LoadingScreen message="Cargando órdenes de compra..." />
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
                <div className="text-center">
                    <div className="mb-4 text-red-500">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-gray-900">Error al cargar las órdenes</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadPurchaseOrders}
                        className="px-4 py-2 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </div>
        )
    }

    const filteredOrders = getFilteredAndSortedOrders()
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-4">
                        <span className="h-2 w-2 rounded-full bg-[#f74116]" />
                        Compras y Proveedores
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                Órdenes de Compra
                            </h1>
                            <p className="text-gray-600 mt-2">
                                {filteredOrders.length} de {purchaseOrders.length} {purchaseOrders.length === 1 ? 'orden' : 'órdenes'}
                                {statusFilter !== 'ALL' && ' (filtrado)'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/purchase-orders/create')}
                            className="flex items-center gap-2 px-6 py-3 text-white bg-[#f74116] rounded-lg hover:bg-[#d63912] transition-colors shadow-lg hover:shadow-xl"
                        >
                            <IoAddCircleOutline className="w-5 h-5" />
                            <span className="font-semibold">Nueva Orden</span>
                        </button>
                    </div>
                </div>

                {/* Orders List with integrated header */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 overflow-hidden hover:shadow-lg transition-all duration-200">

                    {/* Header with filters and summary */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                            {/* Left: Title and Total Summary */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <IoCashOutline className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Órdenes Registradas</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-2xl font-bold text-orange-600">
                                            {formatCurrency(totalAmount)}
                                        </p>
                                        <span className="text-sm text-gray-500">
                                            • {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Filters and Sort */}
                            <div className="flex flex-col sm:flex-row gap-3">

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | 'ALL')}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116] bg-white"
                                >
                                    <option value="ALL">Todos los estados</option>
                                    <option value="PENDING">🟡 Pendiente</option>
                                    <option value="RECEIVED">🟢 Recibida</option>
                                    <option value="CANCELLED">🔴 Cancelada</option>
                                </select>

                                {/* Sort Controls */}
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                    <IoSwapVerticalOutline className="w-4 h-4 text-gray-600" />
                                    <span className="text-xs text-gray-600 hidden sm:inline">Ordenar:</span>
                                    <button
                                        onClick={() => handleSort('date')}
                                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${sortField === 'date'
                                                ? 'bg-[#f74116] text-white'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <IoCalendarOutline className="w-3.5 h-3.5" />
                                        <span>Fecha</span>
                                        {sortField === 'date' && (
                                            <span className="text-xs">
                                                {sortOrder === 'desc' ? '↓' : '↑'}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleSort('amount')}
                                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${sortField === 'amount'
                                                ? 'bg-[#f74116] text-white'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <IoCashOutline className="w-3.5 h-3.5" />
                                        <span>Monto</span>
                                        {sortField === 'amount' && (
                                            <span className="text-xs">
                                                {sortOrder === 'desc' ? '↓' : '↑'}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Content */}
                    <div className="p-6">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <IoReceiptOutline className="w-10 h-10 text-gray-400" />
                                </div>
                                {purchaseOrders.length === 0 ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay órdenes registradas</h3>
                                        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                            Las órdenes de compra que crees aparecerán aquí
                                        </p>
                                        <button
                                            onClick={() => navigate('/purchase-orders/create')}
                                            className="px-6 py-3 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors font-medium"
                                        >
                                            Crear Primera Orden
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay órdenes con el filtro seleccionado</h3>
                                        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                            Intenta ajustar el filtro de estado para ver más resultados
                                        </p>
                                        <button
                                            onClick={() => setStatusFilter('ALL')}
                                            className="px-4 py-2 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors"
                                        >
                                            Limpiar filtro
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Órdenes Registradas</h2>
                                    <p className="text-sm text-gray-500">
                                        Mostrando {filteredOrders.length} {filteredOrders.length === 1 ? 'resultado' : 'resultados'}
                                    </p>
                                </div>

                                {filteredOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="group p-6 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm"
                                    >
                                        {/* Grid Layout: Proveedor | Estado | Fecha | Items | Total | Acciones */}
                                        <div className="grid grid-cols-12 gap-4 items-center">

                                            {/* Column 1-2: Icon + Proveedor */}
                                            <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#f74116]/10 to-[#f74116]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <IoReceiptOutline className="w-5 h-5 text-[#f74116]" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-base font-semibold text-gray-900 truncate">
                                                            {order.supplierName}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                            #{order.id.substring(0, 8).toUpperCase()}
                                                        </span>
                                                        {/* Mobile: Show status here */}
                                                        <div className="md:hidden">
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Estado (Desktop only) */}
                                            <div className="hidden md:flex col-span-2 justify-center">
                                                {getStatusBadge(order.status)}
                                            </div>

                                            {/* Column 4: Fecha + Items */}
                                            <div className="col-span-6 md:col-span-3">
                                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                                    <IoCalendarOutline className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(order.createdAt)}</span>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                                                    {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                                                </span>
                                            </div>

                                            {/* Column 5: Total */}
                                            <div className="col-span-6 md:col-span-2 text-right md:text-center">
                                                <div className="flex items-center justify-end md:justify-center gap-1 text-xl font-bold text-[#f74116]">
                                                    <IoCashOutline className="w-5 h-5" />
                                                    <span className="truncate">{formatCurrency(order.totalAmount)}</span>
                                                </div>
                                            </div>

                                            {/* Column 6: Acciones */}
                                            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/purchase-orders/${order.id}`)}
                                                    className="p-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                                                    title="Ver detalles"
                                                >
                                                    <IoEyeOutline className="w-4 h-4" />
                                                </button>
                                                {order.status === 'PENDING' && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => handleReceiveOrder(order.id, e)}
                                                            disabled={processing === order.id}
                                                            className="p-2 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Recibir orden"
                                                        >
                                                            <IoCheckmarkCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleCancelOrder(order.id, e)}
                                                            disabled={processing === order.id}
                                                            className="p-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Cancelar orden"
                                                        >
                                                            <IoCloseCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PurchaseOrders
