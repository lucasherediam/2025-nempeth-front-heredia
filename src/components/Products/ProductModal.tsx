import { useState, useEffect } from 'react'
import { type Product, StockUnit } from '../../services/productService'
import { type Category as CategoryType } from '../../services/categoryService'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Omit<Product, 'id'> & { id?: string }) => Promise<void>
  product?: Product | null
  error?: string | null
  categories: CategoryType[]
  prefilledName?: string
}

function ProductModal({ isOpen, onClose, onSave, product, error, categories, prefilledName }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    categoryId: '',
    stockQuantity: 0,
    stockUnit: StockUnit.UNIDADES as StockUnit,
    reorderPoint: 0
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        categoryId: product.categoryId ? product.categoryId : '',
        stockQuantity: product.stockQuantity ?? 0,
        stockUnit: product.stockUnit ?? StockUnit.UNIDADES,
        reorderPoint: product.reorderPoint ?? 0
      })
    } else {
      setFormData({
        name: prefilledName || '',
        description: '',
        price: 0,
        cost: 0,
        categoryId: categories.length > 0 ? categories[0].id : '',
        stockQuantity: 0,
        stockUnit: StockUnit.UNIDADES,
        reorderPoint: 0
      })
    }
    setSaving(false) // Resetear estado de guardado
  }, [product, isOpen, categories, prefilledName])

  // Prevenir scroll del fondo cuando el modal está abierto
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
    if (formData.name.trim() && formData.description.trim() && formData.price > 0 && formData.cost >= 0 && formData.categoryId) {
      setSaving(true)
      try {
        await onSave({
          ...formData,
          ...(product && { id: product.id })
        })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    let finalValue = value
    if (name === 'description' && value.length > 300) {
      finalValue = value.substring(0, 300)
    }

    setFormData(prev => ({
      ...prev,
      [name]: (
        name === 'price' || name === 'cost' || name === 'stockQuantity' || name === 'reorderPoint'
      ) ? parseFloat(finalValue) || 0 : finalValue
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">{product ? 'Editar Producto' : 'Agregar Producto'}</h3>
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
            <label className="block text-sm font-semibold text-gray-700" htmlFor="name">Nombre del Producto</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ingresa el nombre del producto"
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="categoryId">Categoría del Producto</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe el producto"
              className="w-full min-h-[4rem] rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
            />
            <div className="flex justify-end">
              <span className={`text-xs sm:text-sm ${formData.description.length > 280 ? 'text-orange-600' : formData.description.length === 300 ? 'text-red-600' : 'text-gray-500'}`}>
                {formData.description.length}/300
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="cost">Costo ($)</label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="price">Precio ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="stockQuantity">Cantidad en Stock</label>
              <input
                type="number"
                id="stockQuantity"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="stockUnit">Unidad</label>
              <select
                id="stockUnit"
                name="stockUnit"
                value={formData.stockUnit}
                onChange={handleChange}
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
              <label className="block text-sm font-semibold text-gray-700" htmlFor="reorderPoint">Punto de Reorden</label>
              <input
                type="number"
                id="reorderPoint"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 sm:py-3 text-sm sm:text-base transition focus:border-[#f74116] focus:outline-none focus:ring-4 focus:ring-[#f74116]/20"
              />
            </div>
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
              {saving ? 'Guardando...' : (product ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form >
      </div >
    </div >
  )
}

export default ProductModal