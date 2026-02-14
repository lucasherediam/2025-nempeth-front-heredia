import { useState, useEffect, useCallback, useMemo } from 'react'
import { stockService, type StockItem, type StockStatus } from '../services/stockService'
import { categoryService, type Category as CategoryType } from '../services/categoryService'
import { useAuth } from '../contexts/useAuth'
import LoadingScreen from '../components/LoadingScreen'
import StockEditModal from '../components/Stock/StockEditModal'
import { IoSearchOutline } from 'react-icons/io5'

function Stock() {
    const { user } = useAuth()
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([])
    const [selectedStatusFilters, setSelectedStatusFilters] = useState<StockStatus[]>([])
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)

    const businessId = user?.businessId

    const loadCategories = useCallback(async () => {
        if (!businessId) return

        try {
            const fetchedCategories = await categoryService.getCategories(businessId)
            setCategories(fetchedCategories)
        } catch (err) {
            console.error('Error cargando categorías:', err)
        }
    }, [businessId])

    const loadStock = useCallback(async () => {
        if (!businessId) return

        try {
            setLoading(true)
            setError(null)
            const fetchedStock = await stockService.getStock(businessId)
            setStockItems(fetchedStock)
        } catch (err) {
            console.error('Error cargando stock:', err)
            setError('Error al cargar el stock')
        } finally {
            setLoading(false)
        }
    }, [businessId])

    useEffect(() => {
        loadStock()
        loadCategories()
    }, [loadStock, loadCategories])

    // Filtrar items
    const filteredStockItems = useMemo(() => {
        let filtered = stockItems

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter(item =>
                item.productName.toLowerCase().includes(query)
            )
        }

        // Filtrar por categoría
        if (selectedCategoryFilters.length > 0) {
            filtered = filtered.filter(item =>
                selectedCategoryFilters.includes(item.categoryId)
            )
        }

        // Filtrar por estado
        if (selectedStatusFilters.length > 0) {
            filtered = filtered.filter(item =>
                selectedStatusFilters.includes(item.status)
            )
        }

        return filtered
    }, [stockItems, searchQuery, selectedCategoryFilters, selectedStatusFilters])

    const handleEditStock = (item: StockItem) => {
        setEditingStockItem(item)
        setIsEditModalOpen(true)
    }

    const handleSaveStock = async (productId: string, stockData: any) => {
        if (!businessId || processing) return

        try {
            setProcessing(true)
            setError(null)
            await stockService.updateStock(businessId, productId, stockData)
            await loadStock()
            setIsEditModalOpen(false)
            setEditingStockItem(null)
        } catch (err) {
            console.error('Error actualizando stock:', err)
            setError('Error al actualizar el stock. Por favor, intenta nuevamente.')
        } finally {
            setProcessing(false)
        }
    }

    const handleToggleCategoryFilter = (categoryId: string) => {
        setSelectedCategoryFilters(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleToggleStatusFilter = (status: StockStatus) => {
        setSelectedStatusFilters(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        )
    }

    const handleClearAllFilters = () => {
        setSelectedCategoryFilters([])
        setSelectedStatusFilters([])
        setSearchQuery('')
    }

    const getStatusBadge = (status: StockStatus) => {
        const badges = {
            OK: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                border: 'border-green-200',
                label: 'Stock OK',
                icon: '🟢'
            },
            LOW: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                border: 'border-yellow-200',
                label: 'Stock Bajo',
                icon: '🟡'
            },
            BELOW_MIN: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                border: 'border-red-200',
                label: 'Stock Crítico',
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            // Close status dropdown
            if (showFilterDropdown && !target.closest('.filter-dropdown-container')) {
                setShowFilterDropdown(false)
            }
            // Close category dropdown
            const categoryDropdown = document.querySelector('.category-dropdown')
            if (categoryDropdown && !categoryDropdown.classList.contains('hidden')) {
                if (!target.closest('.category-filter-button') && !target.closest('.category-dropdown')) {
                    categoryDropdown.classList.add('hidden')
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showFilterDropdown])

    if (loading) {
        return <LoadingScreen message="Cargando inventario..." />
    }

    if (error && stockItems.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
                <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="p-8 text-center transition-all duration-200 bg-white border border-red-200 shadow-sm rounded-2xl hover:shadow-lg">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="mb-3 text-xl font-bold text-gray-900">Error al cargar inventario</h2>
                        <p className="mb-8 text-gray-600">{error}</p>
                        <button
                            onClick={loadStock}
                            className="px-6 py-3 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors font-medium"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
            <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-4">
                        <span className="h-2 w-2 rounded-full bg-[#f74116]" />
                        Control de Inventario
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Stock de Productos
                    </h1>
                    <p className="text-gray-600">Monitorea y controla los niveles de inventario en tiempo real</p>
                </div>

                {/* Stock Statistics */}
                {stockItems.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-3">
                        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Stock OK</p>
                                    <p className="mt-2 text-3xl font-bold text-green-600">
                                        {stockItems.filter(item => item.status === 'OK').length}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                                    <span className="text-2xl">🟢</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                                    <p className="mt-2 text-3xl font-bold text-yellow-600">
                                        {stockItems.filter(item => item.status === 'LOW').length}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                                    <span className="text-2xl">🟡</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                                    <p className="mt-2 text-3xl font-bold text-red-600">
                                        {stockItems.filter(item => item.status === 'BELOW_MIN').length}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                                    <span className="text-2xl">🔴</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6 mb-8 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        {/* Buscador */}
                        <div className="relative flex-1 min-w-[250px]">
                            <IoSearchOutline className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116] transition-all"
                            />
                        </div>

                        {/* Filtro de Estado */}
                        <div className="relative filter-dropdown-container">
                            <button
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={processing}
                                type="button"
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            >
                                <span className="text-lg">📊</span>
                                <span className="text-sm font-medium">Estado</span>
                                {selectedStatusFilters.length > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#f74116] rounded-full">
                                        {selectedStatusFilters.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown menu de Estado */}
                            {showFilterDropdown && (
                                <div className="absolute left-0 z-50 w-64 py-2 mt-2 bg-white border border-gray-200 shadow-xl top-full rounded-xl">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-800">Estado del Stock</h4>
                                    </div>
                                    <div className="py-2">
                                        {(['OK', 'LOW', 'BELOW_MIN'] as StockStatus[]).map(status => (
                                            <button
                                                key={status}
                                                className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors ${selectedStatusFilters.includes(status) ? 'bg-[#f74116]/10' : ''}`}
                                                onClick={() => handleToggleStatusFilter(status)}
                                                type="button"
                                            >
                                                <span className="text-sm">
                                                    {status === 'OK' && '🟢 Stock OK'}
                                                    {status === 'LOW' && '🟡 Stock Bajo'}
                                                    {status === 'BELOW_MIN' && '🔴 Stock Crítico'}
                                                </span>
                                                {selectedStatusFilters.includes(status) && (
                                                    <span className="text-[#f74116]">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedStatusFilters.length > 0 && (
                                        <div className="px-4 py-2 border-t border-gray-100">
                                            <button
                                                className="w-full text-sm font-medium text-red-600 hover:text-red-800"
                                                onClick={() => setSelectedStatusFilters([])}
                                                type="button"
                                            >
                                                Limpiar estado
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Filtro de Categoría - Nuevo botón separado */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed category-filter-button"
                                disabled={processing}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowFilterDropdown(false) // Close status dropdown if open
                                    const dropdown = e.currentTarget.nextElementSibling
                                    if (dropdown) {
                                        dropdown.classList.toggle('hidden')
                                    }
                                }}
                            >
                                <span className="text-lg">🏷️</span>
                                <span className="text-sm font-medium">Categoría</span>
                                {selectedCategoryFilters.length > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#f74116] rounded-full">
                                        {selectedCategoryFilters.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown de Categorías */}
                            <div className="absolute left-0 z-50 hidden w-72 py-2 mt-2 bg-white border border-gray-200 shadow-xl top-full rounded-xl category-dropdown">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <h4 className="text-sm font-semibold text-gray-800">Filtrar por Categoría</h4>
                                </div>
                                <div className="overflow-y-auto max-h-64">
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${selectedCategoryFilters.includes(category.id) ? 'bg-[#f74116]/10 text-[#f74116]' : 'text-gray-700'}`}
                                            onClick={() => handleToggleCategoryFilter(category.id)}
                                            type="button"
                                        >
                                            <span className="text-lg">{category.icon}</span>
                                            <span className="flex-1 text-sm font-medium">{category.name}</span>
                                            {selectedCategoryFilters.includes(category.id) && (
                                                <span className="text-[#f74116]">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {selectedCategoryFilters.length > 0 && (
                                    <div className="px-4 py-2 border-t border-gray-100">
                                        <button
                                            className="w-full text-sm font-medium text-red-600 hover:text-red-800"
                                            onClick={() => setSelectedCategoryFilters([])}
                                            type="button"
                                        >
                                            Limpiar categorías
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botón para limpiar todos los filtros */}
                        {(selectedCategoryFilters.length > 0 || selectedStatusFilters.length > 0 || searchQuery.trim()) && (
                            <button
                                className="px-4 py-2 text-sm font-medium text-red-600 transition-colors border border-red-200 rounded-lg bg-red-50 hover:bg-red-100"
                                onClick={handleClearAllFilters}
                                type="button"
                            >
                                Limpiar todo
                            </button>
                        )}
                    </div>

                    {/* Active filters */}
                    {(selectedCategoryFilters.length > 0 || selectedStatusFilters.length > 0) && (
                        <div className="flex flex-wrap items-center gap-3">
                            {selectedStatusFilters.map(status => (
                                <div
                                    key={status}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f74116] bg-[#f74116]/10 border border-[#f74116]/20 rounded-full"
                                >
                                    <span>
                                        {status === 'OK' && '🟢 Stock OK'}
                                        {status === 'LOW' && '🟡 Stock Bajo'}
                                        {status === 'BELOW_MIN' && '🔴 Stock Crítico'}
                                    </span>
                                    <button
                                        className="ml-1 font-bold text-[#f74116] hover:text-[#f74116]/80"
                                        onClick={() => handleToggleStatusFilter(status)}
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {selectedCategoryFilters.map(categoryId => {
                                const category = categories.find(cat => cat.id === categoryId)
                                if (!category) return null

                                return (
                                    <div
                                        key={categoryId}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f74116] bg-[#f74116]/10 border border-[#f74116]/20 rounded-full"
                                    >
                                        <span>{category.icon}</span>
                                        <span>{category.name}</span>
                                        <button
                                            className="ml-1 font-bold text-[#f74116] hover:text-[#f74116]/80"
                                            onClick={() => handleToggleCategoryFilter(categoryId)}
                                            type="button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Stock Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 overflow-hidden hover:shadow-lg transition-all duration-200">
                    {filteredStockItems.length === 0 && stockItems.length > 0 ? (
                        <div className="py-16 text-center">
                            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">No se encontraron productos</h3>
                            <p className="max-w-sm mx-auto mb-6 text-gray-600">
                                No hay productos que coincidan con los filtros seleccionados
                            </p>
                            <button
                                className="px-6 py-3 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors font-medium"
                                onClick={handleClearAllFilters}
                                type="button"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : filteredStockItems.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
                                <span className="text-4xl">📦</span>
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">No hay productos en stock</h3>
                            <p className="max-w-sm mx-auto text-gray-600">
                                Agrega productos a tu inventario para comenzar a controlar el stock
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-900">Inventario Actual</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Mostrando {filteredStockItems.length} de {stockItems.length} productos
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Producto
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Categoría
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Stock Actual
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Punto de Reorden
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStockItems.map((item) => (
                                            <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{item.productName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{item.categoryName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {item.stockQuantity.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.stockUnit.toLowerCase().replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-600">
                                                        {item.reorderPoint.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleEditStock(item)}
                                                        disabled={processing}
                                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f74116] bg-[#f74116]/10 rounded-lg hover:bg-[#f74116]/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <StockEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingStockItem(null)
                    setError(null)
                }}
                onSave={handleSaveStock}
                stockItem={editingStockItem}
                error={error}
            />
        </div>
    )
}

export default Stock
