import { useState, useEffect } from 'react'
import { IoAddOutline, IoRemoveOutline, IoCartOutline, IoBanOutline } from 'react-icons/io5'
import { searchUnsplashPhoto } from '../../services/unsplashService'
import { type Product } from '../../services/productService'
import { type Category as CategoryType } from '../../services/categoryService'

interface OrderProductCardProps {
  product: Product
  categories: CategoryType[]
  onAddToCart: (product: Product, quantity: number) => void
  currentCartQuantity?: number
}

function OrderProductCard({ 
  product, 
  categories, 
  onAddToCart,
  currentCartQuantity = 0
}: OrderProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('https://via.placeholder.com/400x300?text=Cargando...')

  const productCategory = categories.find(c => c.id === product.categoryId)
  const stock = product.stockQuantity ?? 0
  const availableStock = Math.max(0, stock - currentCartQuantity)
  const isOutOfStock = availableStock <= 0

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMenu && !target.closest('.menu-container')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Cargar imagen desde Unsplash
  useEffect(() => {
    const loadImage = async () => {
      const query = product?.name || 'product'
      const url = await searchUnsplashPhoto(query)
      setImageUrl(url || '/not_image.png')
    }
    loadImage()
  }, [product?.name])

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) setQuantity(newQuantity)
  }

  // Reset quantity if it exceeds available stock
  useEffect(() => {
    if (quantity > availableStock && availableStock > 0) {
      setQuantity(availableStock)
    } else if (availableStock > 0 && quantity < 1) {
      setQuantity(1)
    }
  }, [availableStock])

  const handleAddToCart = () => {
    onAddToCart(product, quantity)
    setQuantity(1)
  }

  // Función para truncar texto a aproximadamente 1 línea (igual que ProductCard)
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const description = product.description || ''

  return (
    <div className={`relative block overflow-hidden group ${isOutOfStock ? 'opacity-50' : ''}`}>

      {/* Imagen del producto */}
      <img
        src={imageUrl}
        alt={product.name}
        className="object-cover w-full h-64 transition duration-500 group-hover:scale-105 sm:h-72"
      />

      {/* Badge Sin Stock */}
      {isOutOfStock && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-full shadow-sm text-xs font-semibold">
          <IoBanOutline className="w-3.5 h-3.5" />
          Sin stock
        </div>
      )}

      {/* Badge de categoría */}
      {productCategory && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
          <span className="text-sm">{productCategory.icon}</span>
          <span className="text-xs font-medium text-gray-700">{productCategory.name}</span>
        </div>
      )}

      <div className="relative p-6 bg-white border border-gray-100">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-green-600">
            ${product.price.toFixed(2)}
          </p>
        </div>

        <h3 className="mt-1.5 text-lg font-medium text-gray-900">{product.name}</h3>

        <button
          className="mt-1.5 text-left line-clamp-1 text-gray-700 cursor-pointer hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-0.5 transition-all"
          onClick={() => setShowDescriptionModal(true)}
          type="button"
        >
          {truncateText(description)}
        </button>

        {/* Stock disponible */}
        {!isOutOfStock && (
          <p className="mt-1 text-xs text-gray-500">
            Stock disponible: <span className="font-semibold">{availableStock}</span>
          </p>
        )}

        {/* Controles de cantidad */}
        {isOutOfStock ? (
          <div className="flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-gray-100 rounded-lg">
            <IoBanOutline className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Sin stock disponible</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                className="flex items-center justify-center text-gray-600 transition-all duration-200 bg-white border-2 border-gray-300 rounded-lg w-9 h-9 hover:scale-105 hover:bg-gray-50 hover:border-gray-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                type="button"
              >
                <IoRemoveOutline className="text-base" />
              </button>

          <div className="flex items-center justify-center w-12 font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-lg h-9">
            {quantity}
          </div>

          <button
            className="flex items-center justify-center text-gray-600 transition-all duration-200 bg-white border-2 border-gray-300 rounded-lg w-9 h-9 hover:scale-105 hover:bg-gray-50 hover:border-gray-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= availableStock}
            type="button"
          >
            <IoAddOutline className="text-base" />
          </button>
        </div>

        {/* Botón agregar al carrito */}
        <button
          className="flex items-center justify-center w-full gap-2 px-4 py-3 mt-4 text-sm font-medium text-white transition rounded-sm bg-[#f74116] hover:scale-105 hover:bg-[#f74116]/90"
          onClick={handleAddToCart}
          type="button"
        >
          <IoCartOutline className="text-lg" />
          Añadir al carrito
        </button>
          </>
        )}
      </div>

      {/* Modal para descripción completa */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
              <button
                className="flex items-center justify-center w-8 h-8 text-2xl text-gray-500 transition rounded-md hover:bg-gray-200 hover:text-gray-700"
                onClick={() => setShowDescriptionModal(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="leading-relaxed text-gray-700">
                {description}
              </p>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                onClick={() => setShowDescriptionModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderProductCard
