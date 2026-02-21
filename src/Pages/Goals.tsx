import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import Modal from '../components/Modal'
import { GoalsService, type ActiveGoalSummaryResponse } from '../services/goalsService'
import { useAuth } from '../contexts/useAuth'
import { IoSearchOutline, IoCalendarOutline, IoTimeOutline, IoCheckmarkCircleOutline, IoCashOutline } from 'react-icons/io5'

function Goals() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<ActiveGoalSummaryResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<{id: string, name: string} | null>(null)
  const [deleteResultModal, setDeleteResultModal] = useState<{type: 'success'|'error', title: string, message: string} | null>(null)
  
  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'period' | 'daysRemaining' | 'categoriesCompleted' | 'totalTarget' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Cargar las metas del negocio
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user?.businessId) {
        setError('No se encontró el ID del negocio')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await GoalsService.getActiveGoalsSummary(user.businessId)
        setGoals(data)
      } catch (err) {
        console.error('Error fetching goals:', err)
        setError('Error al cargar las metas. Por favor, intenta nuevamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [user?.businessId])

  // Función para eliminar una meta
  const handleDeleteGoal = async () => {
    if (!goalToDelete || !user?.businessId) return

    setDeletingGoalId(goalToDelete.id)
    setIsDeleteModalOpen(false)

    try {
      await GoalsService.deleteGoal(user.businessId, goalToDelete.id)
      
      // Actualizar la lista de metas eliminando la meta borrada
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalToDelete.id))
      
      setDeleteResultModal({type: 'success', title: 'Meta eliminada', message: 'La meta ha sido eliminada exitosamente.'})
    } catch (err) {
      console.error('Error deleting goal:', err)
      setDeleteResultModal({type: 'error', title: 'Error', message: 'Error al eliminar la meta. Por favor, intenta nuevamente.'})
    } finally {
      setDeletingGoalId(null)
      setGoalToDelete(null)
    }
  }

  // Función para calcular días restantes
  const calculateDaysRemaining = (daysRemainingStr: string): { days: number; text: string } => {
    // El backend envía el string "X días" o puede estar vencida
    const match = daysRemainingStr.match(/(-?\d+)\s*días?/i)
    if (match) {
      const days = parseInt(match[1], 10)
      return { days, text: days < 0 ? 'Vencida' : `${days} días` }
    }
    return { days: 0, text: daysRemainingStr }
  }

  // Función para formatear fechas
  const formatDateRange = (startDate: string, endDate: string): string => {
    // Parseamos las fechas como fechas locales (sin conversión UTC)
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
    
    const start = new Date(startYear, startMonth - 1, startDay)
    const end = new Date(endYear, endMonth - 1, endDay)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      }).toLowerCase()
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // Función para formatear valores según el tipo de meta
  const formatValue = (value: number, goal: ActiveGoalSummaryResponse): string => {
    if (goal.name.toLowerCase().includes('ventas') || goal.name.toLowerCase().includes('costos') || goal.name.toLowerCase().includes('monto')) {
      return `$${value.toLocaleString()}`
    }
    if (goal.name.toLowerCase().includes('rating')) {
      return value.toFixed(1)
    }
    return value.toString()
  }

  // Función para manejar el ordenamiento
  const handleSort = (field: 'period' | 'daysRemaining' | 'categoriesCompleted' | 'totalTarget') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Función para filtrar y ordenar metas
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(goal =>
        goal.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenar
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number
        let bValue: number

        switch (sortField) {
          case 'period':
            // Ordenar por fecha de inicio del período
            aValue = new Date(a.periodStart).getTime()
            bValue = new Date(b.periodStart).getTime()
            break
          case 'daysRemaining': {
            // Extraer el número de días restantes
            const aDays = calculateDaysRemaining(a.daysRemaining).days
            const bDays = calculateDaysRemaining(b.daysRemaining).days
            aValue = aDays
            bValue = bDays
            break
          }
          case 'categoriesCompleted':
            aValue = a.categoriesCompleted
            bValue = b.categoriesCompleted
            break
          case 'totalTarget':
            aValue = a.totalTarget
            bValue = b.totalTarget
            break
          default:
            return 0
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })
    }

    return filtered
  }, [goals, searchTerm, sortField, sortOrder])

  if (loading) {
    return <LoadingScreen message="Cargando metas..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
        <div className="px-4 py-8 pb-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="p-6 border border-red-200 bg-red-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Error al cargar las metas</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 mt-4 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
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
      <div className="px-4 py-8 pb-24 mx-auto max-w-7xl sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-4">
            <span className="h-2 w-2 rounded-full bg-[#f74116]" />
            Metas del Negocio
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Seguimiento de objetivos
          </h1>
          <p className="mt-2 text-gray-600">Monitorea el progreso de tus metas comerciales</p>
        </div>

        {/* Tabla de metas */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Metas Activas</h2>
                <p className="text-sm text-gray-600">Objetivos y progreso actual</p>
              </div>
              <button
                onClick={() => navigate('/goals/create')}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#f74116] text-white text-sm font-medium rounded-lg hover:bg-[#f74116]/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Meta
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col gap-3">
              
              {/* Buscador */}
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar metas por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116] transition-colors"
                />
              </div>

              {/* Controles de ordenamiento - scroll horizontal en mobile */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium flex-shrink-0">Ordenar:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => handleSort('period')}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      sortField === 'period' 
                        ? 'bg-[#f74116] text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <IoCalendarOutline className="w-4 h-4" />
                    <span>Período</span>
                    {sortField === 'period' && <span className="text-xs ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                  <button
                    onClick={() => handleSort('daysRemaining')}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      sortField === 'daysRemaining' 
                        ? 'bg-[#f74116] text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <IoTimeOutline className="w-4 h-4" />
                    <span>Días restantes</span>
                    {sortField === 'daysRemaining' && <span className="text-xs ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                  <button
                    onClick={() => handleSort('categoriesCompleted')}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      sortField === 'categoriesCompleted' 
                        ? 'bg-[#f74116] text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    <span>Categorías</span>
                    {sortField === 'categoriesCompleted' && <span className="text-xs ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                  <button
                    onClick={() => handleSort('totalTarget')}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      sortField === 'totalTarget' 
                        ? 'bg-[#f74116] text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <IoCashOutline className="w-4 h-4" />
                    <span>Monto</span>
                    {sortField === 'totalTarget' && <span className="text-xs ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredAndSortedGoals.map((goal) => {
              const daysRemaining = calculateDaysRemaining(goal.daysRemaining)
              return (
                <div key={goal.id} className="px-4 py-4 flex flex-col gap-3">
                  {/* Nombre + meta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-900 truncate">{goal.name}</p>
                      <p className="text-sm text-gray-500">Meta: <span className="font-semibold text-[#f74116]">${goal.totalTarget.toLocaleString()}</span></p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/goals/${goal.id}`)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[#f74116] bg-[#f74116]/10 rounded-lg hover:bg-[#f74116]/20 transition-colors"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => { setGoalToDelete({id: goal.id, name: goal.name}); setIsDeleteModalOpen(true) }}
                        disabled={deletingGoalId === goal.id}
                        className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deletingGoalId === goal.id ? (
                          <div className="w-3 h-3 border-2 border-red-600 rounded-full border-t-transparent animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">Período</p>
                      <p className="text-xs font-medium text-gray-900">{formatDateRange(goal.periodStart, goal.periodEnd)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">Días restantes</p>
                      <p className={`text-xs font-semibold ${
                        daysRemaining.days < 0 ? 'text-red-600' :
                        daysRemaining.days <= 7 ? 'text-orange-600' : 'text-gray-900'
                      }`}>{daysRemaining.text}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">Categorías</p>
                      <p className={`text-xs font-semibold ${
                        goal.categoriesCompleted === goal.categoriesTotal ? 'text-green-600' :
                        goal.categoriesCompleted > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>{goal.categoriesCompleted}/{goal.categoriesTotal}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Nombre de la meta
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Período
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Días restantes
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Categorías cumplidas
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Monto total
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedGoals.map((goal) => {
                  const daysRemaining = calculateDaysRemaining(goal.daysRemaining)

                  return (
                    <tr key={goal.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{goal.name}</div>
                        <div className="text-sm text-gray-500">
                          Meta: <span className="font-semibold text-[#f74116]">{formatValue(goal.totalTarget, goal)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateRange(goal.periodStart, goal.periodEnd)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          daysRemaining.days < 0 ? 'text-red-600' :
                          daysRemaining.days <= 7 ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {daysRemaining.text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          goal.categoriesCompleted === goal.categoriesTotal ? 'text-green-600' :
                          goal.categoriesCompleted > 0 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {goal.categoriesCompleted}/{goal.categoriesTotal}
                        </div>
                        <div className="text-xs text-gray-500">
                          {goal.completionStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${goal.totalTarget.toLocaleString()}
                        </div>
                      </td>
                      <td className="flex items-center justify-center px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/goals/${goal.id}`)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[#f74116] bg-[#f74116]/10 rounded-lg hover:bg-[#f74116]/20 transition-colors"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => { setGoalToDelete({id: goal.id, name: goal.name}); setIsDeleteModalOpen(true); }}
                            disabled={deletingGoalId === goal.id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar meta"
                          >
                            {deletingGoalId === goal.id ? (
                              <div className="w-3 h-3 border-2 border-red-600 rounded-full border-t-transparent animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedGoals.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {goals.length === 0 ? (
                <>
                  <h3 className="mb-1 text-sm font-medium text-gray-900">No hay metas activas</h3>
                  <p className="text-sm text-gray-500">Crea tu primera meta para comenzar a trackear objetivos</p>
                </>
              ) : (
                <>
                  <h3 className="mb-1 text-sm font-medium text-gray-900">No se encontraron metas</h3>
                  <p className="text-sm text-gray-500">No hay metas que coincidan con tu búsqueda</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-3 px-4 py-2 bg-[#f74116] text-white text-sm rounded-lg hover:bg-[#f74116]/90 transition-colors"
                  >
                    Limpiar búsqueda
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && goalToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Eliminar Meta"
          message={`¿Estás seguro de que deseas eliminar la meta "${goalToDelete.name}"? Esta acción no se puede deshacer.`}
          type="error"
          showCancelButton={true}
          onConfirm={handleDeleteGoal}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      )}

      {/* Modal de resultado */}
      {deleteResultModal && (
        <Modal
          isOpen={!!deleteResultModal}
          onClose={() => setDeleteResultModal(null)}
          title={deleteResultModal.title}
          message={deleteResultModal.message}
          type={deleteResultModal.type}
          showCancelButton={false}
          confirmText="Aceptar"
        />
      )}
    </div>
  )
}

export default Goals