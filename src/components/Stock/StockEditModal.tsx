import { useState, useEffect } from 'react'
import { StockUnit } from '../../services/productService'
import type { StockItem, UpdateStockRequest } from '../../services/stockService'

interface StockEditModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (productId: string, stockData: UpdateStockRequest) => Promise<void>
    stockItem: StockItem | null
    error?: string | null
}

function StockEditModal({ isOpen, onClose, onSave, stockItem, error }: StockEditModalProps) {
    const [formData, setFormData] = useState({
        stockQuantity: 0,
        unit: StockUnit.UNIDADES as StockUnit,
        reorderPoint: 0
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (stockItem) {
            setFormData({
                stockQuantity: stockItem.stockQuantity,
                unit: stockItem.stockUnit,
                reorderPoint: stockItem.reorderPoint
            })
        }
        setSaving(false)
    }, [stockItem, isOpen])

    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            return () => {
                document.body.style.overflow = originalOverflow
            }
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stockItem || formData.stockQuantity < 0 || formData.reorderPoint < 0) return

        setSaving(true)
        try {
            await onSave(stockItem.productId, formData)
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'stockQuantity' || name === 'reorderPoint') ? parseFloat(value) || 0 : value
        }))
    }

    const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select()
    }

    if (!isOpen || !stockItem) return null

    return (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 sm:items-center sm:p-4 md:p-6">
            <div className="flex flex-col w-full max-w-md sm:max-w-lg h-auto max-h-[92dvh] sm:max-h-[90vh] bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl">

                {/* Header — siempre visible */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-gray-200 sm:px-6 bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Editar Stock</h3>
                        <p className="mt-0.5 text-sm text-gray-600 truncate max-w-[240px]">{stockItem.productName}</p>
                    </div>
                    <button
                        className="flex items-center justify-center w-8 h-8 text-2xl text-gray-500 transition rounded-md hover:bg-gray-200 hover:text-gray-700"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    <form id="stock-edit-form" onSubmit={handleSubmit} className="px-4 py-4 space-y-4 sm:px-6 sm:py-5">
                        {error && (
                            <div className="px-3 py-3 text-sm font-medium text-red-600 border border-red-200 rounded-md bg-red-50">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700" htmlFor="stockQuantity">
                                Cantidad en Stock
                            </label>
                            <input
                                type="number"
                                id="stockQuantity"
                                name="stockQuantity"
                                value={formData.stockQuantity}
                                onChange={handleChange}
                                onFocus={handleNumberFocus}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700" htmlFor="unit">
                                Unidad de Medida
                            </label>
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
                            >
                                {Object.entries(StockUnit).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700" htmlFor="reorderPoint">
                                Punto de Reorden
                            </label>
                            <input
                                type="number"
                                id="reorderPoint"
                                name="reorderPoint"
                                value={formData.reorderPoint}
                                onChange={handleChange}
                                onFocus={handleNumberFocus}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Recibirás una alerta cuando el stock esté por debajo de este valor
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer — siempre visible */}
                <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 py-4 border-t border-gray-200 sm:px-6 bg-white rounded-b-2xl">
                    <button
                        type="button"
                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="stock-edit-form"
                        className="rounded-lg bg-[#f74116] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f74116]/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StockEditModal
