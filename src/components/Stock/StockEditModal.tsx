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

    if (!isOpen || !stockItem) return null

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl">
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 sm:px-6 bg-gray-50">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">Editar Stock</h3>
                        <p className="mt-1 text-sm text-gray-600">{stockItem.productName}</p>
                    </div>
                    <button
                        className="flex items-center justify-center w-8 h-8 text-xl text-gray-500 transition rounded-md sm:text-2xl hover:bg-gray-200 hover:text-gray-700"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 sm:px-6 sm:py-6 sm:space-y-6">
                    {error && (
                        <div className="px-3 py-3 text-sm font-medium text-red-600 border border-red-200 rounded-md sm:px-4 bg-red-50">
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
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
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
                            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
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
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Recibirás una alerta cuando el stock esté por debajo de este valor
                        </p>
                    </div>

                    <div className="flex flex-col items-stretch justify-end gap-3 pt-4 border-t border-gray-200 sm:flex-row sm:items-center sm:pt-6">
                        <button
                            type="button"
                            className="order-2 px-4 py-2 text-sm font-semibold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 sm:order-1"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-[#f74116] px-4 sm:px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f74116]/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 order-1 sm:order-2"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default StockEditModal
