import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import LoadingScreen from '../components/LoadingScreen'
import { purchaseOrderService, type PurchaseOrderItemRequest } from '../services/purchaseOrderService'
import { productService, type Product } from '../services/productService'
import { IoAddCircleOutline, IoTrash, IoSave } from 'react-icons/io5'

interface OrderItem extends PurchaseOrderItemRequest {
    tempId: string
    productName?: string
}

function CreatePurchaseOrder() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [supplierName, setSupplierName] = useState('')
    const [items, setItems] = useState<OrderItem[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user?.businessId) {
            loadProducts()
        }
    }, [user?.businessId])

    const loadProducts = async () => {
        if (!user?.businessId) return

        try {
            setLoading(true)
            const data = await productService.getProducts(user.businessId)
            setProducts(data)
        } catch (err) {
            console.error('Error loading products:', err)
            setError('Error al cargar los productos')
        } finally {
            setLoading(false)
        }
    }

    const addItem = () => {
        const newItem: OrderItem = {
            tempId: `temp-${Date.now()}`,
            productId: '',
            quantity: 1,
            unitCost: 0
        }
        setItems([...items, newItem])
    }

    const removeItem = (tempId: string) => {
        setItems(items.filter(item => item.tempId !== tempId))
    }

    const updateItem = (tempId: string, field: keyof OrderItem, value: string | number) => {
        setItems(items.map(item => {
            if (item.tempId === tempId) {
                const updated = { ...item, [field]: value }

                // If product changed, update product name and cost
                if (field === 'productId' && value) {
                    const product = products.find(p => p.id === value)
                    if (product) {
                        updated.productName = product.name
                        updated.unitCost = product.cost || 0
                    }
                }

                return updated
            }
            return item
        }))
    }

    const calculateItemTotal = (item: OrderItem) => {
        return item.quantity * item.unitCost
    }

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
    }

    // Get available products for a specific item (excluding already selected ones)
    const getAvailableProducts = (currentItemId: string) => {
        const selectedProductIds = items
            .filter(item => item.tempId !== currentItemId && item.productId)
            .map(item => item.productId)

        return products.filter(product => !selectedProductIds.includes(product.id))
    }

    const validateForm = (): string | null => {
        if (!supplierName.trim()) {
            return 'El nombre del proveedor es requerido'
        }

        if (items.length === 0) {
            return 'Debe agregar al menos un producto'
        }

        // Check for duplicate products (shouldn't happen now, but keep as safety)
        const productIds = items.map(item => item.productId).filter(id => id)
        const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index)
        if (duplicates.length > 0) {
            const duplicateProduct = products.find(p => p.id === duplicates[0])
            return `El producto "${duplicateProduct?.name}" está duplicado. Por favor, elimina uno de los items duplicados o aumenta la cantidad en uno solo.`
        }

        for (const item of items) {
            if (!item.productId) {
                return 'Todos los productos deben estar seleccionados'
            }
            if (item.quantity <= 0) {
                return 'Las cantidades deben ser mayores a 0'
            }
            if (item.unitCost <= 0) {
                return 'Los costos unitarios deben ser mayores a 0'
            }
        }

        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const validationError = validateForm()
        if (validationError) {
            alert(validationError)
            return
        }

        if (!user?.businessId) return

        try {
            setSubmitting(true)
            setError(null)

            const requestItems: PurchaseOrderItemRequest[] = items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost
            }))

            const response = await purchaseOrderService.createPurchaseOrder(
                user.businessId,
                {
                    supplierName: supplierName.trim(),
                    items: requestItems
                }
            )

            // Navigate to the created order details
            navigate(`/purchase-orders/${response.purchaseOrderId}`)
        } catch (err) {
            console.error('Error creating purchase order:', err)
            setError('Error al crear la orden de compra. Por favor intenta nuevamente.')
            setSubmitting(false)
        }
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
            <div className="px-4 py-8 mx-auto max-w-5xl sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-4">
                        <span className="h-2 w-2 rounded-full bg-[#f74116]" />
                        Nueva Orden de Compra
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Crear Orden de Compra
                    </h1>
                    <p className="text-gray-600">Registra una nueva orden de compra a proveedor</p>
                </div>

                {error && (
                    <div className="p-4 mb-6 text-red-800 bg-red-100 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Supplier Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6 mb-6 hover:shadow-lg transition-all duration-200">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Información del Proveedor</h2>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Nombre del Proveedor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={supplierName}
                                onChange={(e) => setSupplierName(e.target.value)}
                                placeholder="Ej: Distribuidora ABC"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116] transition-all"
                                maxLength={255}
                                required
                            />
                        </div>
                    </div>

                    {/* Products */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6 mb-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-4 py-2 text-[#f74116] bg-[#f74116]/10 rounded-lg hover:bg-[#f74116]/20 transition-colors"
                            >
                                <IoAddCircleOutline className="w-5 h-5" />
                                <span className="font-medium">Agregar Producto</span>
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <div className="mb-3 text-5xl">📦</div>
                                <p>No hay productos agregados</p>
                                <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => {
                                    const availableProducts = getAvailableProducts(item.tempId)
                                    return (
                                        <div
                                            key={item.tempId}
                                            className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            {/* Product Select - full width */}
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-700">
                                                    Producto <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => updateItem(item.tempId, 'productId', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116]"
                                                    required
                                                >
                                                    <option value="">Seleccionar producto...</option>
                                                    {availableProducts.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quantity + Unit Cost + Subtotal in a row */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block mb-1 text-xs font-medium text-gray-700">
                                                        Cantidad <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.tempId, 'quantity', parseInt(e.target.value) || 0)}
                                                        onFocus={(e) => e.target.select()}
                                                        min="1"
                                                        step="1"
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116]"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block mb-1 text-xs font-medium text-gray-700">
                                                        Costo Unit. <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.unitCost}
                                                        onChange={(e) => updateItem(item.tempId, 'unitCost', parseFloat(e.target.value) || 0)}
                                                        onFocus={(e) => e.target.select()}
                                                        min="0.01"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116]"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block mb-1 text-xs font-medium text-gray-700">
                                                        Subtotal
                                                    </label>
                                                    <div className="px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-100 rounded-lg truncate">
                                                        {formatCurrency(calculateItemTotal(item))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.tempId)}
                                                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                title="Eliminar producto"
                                            >
                                                <IoTrash className="w-4 h-4" />
                                                Eliminar
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    {
                        items.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6 mb-6 hover:shadow-lg transition-all duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-semibold text-gray-900">Total de la Orden:</span>
                                    <span className="text-2xl font-bold text-[#f74116]">
                                        {formatCurrency(calculateTotal())}
                                    </span>
                                </div>
                            </div>
                        )
                    }

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/purchase-orders')}
                            className="flex-1 px-6 py-3 font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || items.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-[#f74116] rounded-lg hover:bg-[#d63912] transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoSave className="w-5 h-5" />
                            {submitting ? 'Guardando...' : 'Guardar Orden'}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    )
}

export default CreatePurchaseOrder
