import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/useAuth'
import { IoTrophy, IoFlame, IoTrendingUp, IoArrowUp } from 'react-icons/io5'
import LoadingScreen from '../components/LoadingScreen'
import { rankingService, type EmployeeRankingResponse, type BusinessRankingResponse } from '../services/rankingService'

export default function InternalRanking() {
  const { user } = useAuth()
  const [employeeRankings, setEmployeeRankings] = useState<EmployeeRankingResponse[]>([])
  const [businessRankings, setBusinessRankings] = useState<BusinessRankingResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const isEmployee = user?.role === 'USER'

  // Encontrar el empleado actual (para empleados, no para owners)
  const currentUserEmployee = isEmployee 
    ? employeeRankings.find(emp => emp.currentUser === true)
    : null

  // Encontrar el negocio actual
  const ownBusiness = businessRankings.find(business => business.isOwnBusiness === true)

  useEffect(() => {
    const fetchRankings = async () => {
      if (!user?.businessId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Cargar ambos rankings en paralelo
        const [employeeRankingsData, businessRankingsData] = await Promise.all([
          rankingService.getEmployeeRankings(user.businessId),
          rankingService.getBusinessRankings(user.businessId)
        ])
        
        setEmployeeRankings(employeeRankingsData)
        setBusinessRankings(businessRankingsData)
      } catch (err) {
        console.error('Error al cargar los rankings:', err)
        setError('No se pudo cargar los rankings. Por favor, intenta nuevamente.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [user?.businessId])

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-amber-500 to-yellow-600'
      case 2:
        return 'from-slate-400 to-gray-500'
      case 3:
        return 'from-orange-500 to-amber-600'
      default:
        return 'from-rose-500 to-orange-600'
    }
  }

  const getMotivationalMessage = (business: BusinessRankingResponse, nextBusiness?: BusinessRankingResponse) => {
    const scoreGap = nextBusiness ? nextBusiness.score - business.score : 0
    
    if (business.position === 1) {
      return {
        title: '🎉 ¡Tu negocio está en el primer lugar!',
        message: 'Mantén este excelente trabajo y continúa liderando el ranking público. Cada venta cuenta para mantener la posición.',
        color: 'from-amber-500 to-yellow-600'
      }
    } else if (business.position <= 3) {
      return {
        title: `🏆 Tu negocio está en el puesto #${business.position}`,
        message: scoreGap > 0 
          ? `¡Vas muy bien! Solo necesitas ${scoreGap.toFixed(2)} puntos más para alcanzar el puesto #${business.position - 1}. El podio está cerca, ¡sigue adelante!`
          : `¡Vas muy bien! Sigue esforzándote para alcanzar el puesto #${business.position - 1}. El podio está cerca, ¡sigue adelante!`,
        color: 'from-orange-500 to-amber-600'
      }
    } else {
      return {
        title: `📊 Tu negocio está en el puesto #${business.position}`,
        message: scoreGap > 0
          ? `Necesitas ${scoreGap.toFixed(2)} puntos más para subir al puesto #${business.position - 1}. ¡Cada venta te acerca más al top 3 del ranking público!`
          : `¡Sigue esforzándote para subir al puesto #${business.position - 1}. ¡Cada venta te acerca más al top 3 del ranking público!`,
        color: 'from-rose-500 to-orange-600'
      }
    }
  }

  const getEmployeeMotivationalMessage = (employee: EmployeeRankingResponse) => {
    const position = employee.position
    const nextEmployee = employeeRankings.find(emp => emp.position === position - 1)
    const salesGap = nextEmployee ? nextEmployee.sales - employee.sales : 0

    if (position === 1) {
      return {
        title: '👑 ¡Eres el Empleado del Mes!',
        message: '¡Increíble trabajo! Estás liderando el equipo. Sigue así para mantener tu corona.',
        color: 'from-amber-500 to-yellow-600',
        icon: '🎉'
      }
    } else if (position === 2) {
      return {
        title: `🥈 ¡Estás en el puesto #${position}!`,
        message: `¡Muy cerca de la cima! Solo necesitas ${salesGap} ventas más para alcanzar el primer lugar y convertirte en Empleado del Mes.`,
        color: 'from-slate-400 to-gray-500',
        icon: '💪'
      }
    } else if (position === 3) {
      return {
        title: `🥉 ¡Estás en el puesto #${position}!`,
        message: `¡Excelente trabajo! Necesitas ${salesGap} ventas más para subir al segundo lugar. ¡El podio es tuyo!`,
        color: 'from-orange-500 to-amber-600',
        icon: '🔥'
      }
    } else if (position <= 5) {
      return {
        title: `📊 Estás en el puesto #${position}`,
        message: `¡Buen ritmo! Solo ${salesGap} ventas más y estarás en el top 3. ¡Tú puedes lograrlo!`,
        color: 'from-blue-500 to-indigo-600',
        icon: '🚀'
      }
    } else {
      return {
        title: `📈 Estás en el puesto #${position}`,
        message: `Cada venta cuenta. Necesitas ${salesGap} ventas más para subir de posición. ¡Sigue adelante!`,
        color: 'from-rose-500 to-orange-600',
        icon: '💫'
      }
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Cargando ranking..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white flex items-center justify-center">
        <div className="max-w-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Error al cargar el ranking</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Encontrar el siguiente negocio en el ranking (para calcular la brecha)
  const nextBusiness = ownBusiness 
    ? businessRankings.find(b => b.position === ownBusiness.position - 1)
    : undefined

  const motivationalData = ownBusiness ? getMotivationalMessage(ownBusiness, nextBusiness) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-4">
            <IoTrophy className="w-4 h-4" />
            Ranking Interno
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Rendimiento del Equipo
          </h1>
          <p className="text-gray-600 capitalize">
            {currentMonth}
          </p>
        </div>

        {/* Posición del Negocio */}
        {ownBusiness && motivationalData && (
          <div className={`mb-8 bg-gradient-to-r ${motivationalData.color} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-bold">
                  {motivationalData.title}
                </h2>
                <p className="mb-4 text-white/90">
                  {motivationalData.message}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoFlame className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-white/80">Puntuación actual</p>
                      <p className="text-lg font-bold">{ownBusiness.score.toFixed(2)}</p>
                    </div>
                  </div>
                  {ownBusiness.position > 1 && nextBusiness && nextBusiness.score > ownBusiness.score && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <IoArrowUp className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-white/80">Para siguiente puesto</p>
                        <p className="text-lg font-bold">{(nextBusiness.score - ownBusiness.score).toFixed(2)} pts</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl">
                <div className="text-center">
                  <p className="text-sm text-white/80">Posición</p>
                  <p className="text-4xl font-bold">#{ownBusiness.position}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking de Empleados */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ranking de Empleados</h2>
            <p className="mt-1 text-sm text-gray-500">Los mejores vendedores del mes</p>
          </div>

          {/* Mensaje cuando no hay empleados */}
          {employeeRankings.length === 0 && (
            <div className="p-8 text-center bg-gray-50 rounded-xl">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No hay datos de ranking disponibles
              </h3>
              <p className="text-gray-600">
                Aún no hay ventas registradas este mes para mostrar el ranking de empleados.
              </p>
            </div>
          )}

          {/* Empleado del mes destacado */}
          {employeeRankings.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-amber-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 flex-shrink-0 text-3xl">
                  👑
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Empleado del Mes</p>
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {employeeRankings[0].name} {employeeRankings[0].lastName}
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg">
                  <IoFlame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500">Ventas</p>
                    <p className="text-lg font-bold text-gray-900">{employeeRankings[0].sales}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg">
                  <span className="text-base flex-shrink-0">💰</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500">Ingresos</p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      ${employeeRankings[0].revenue.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card motivacional para el empleado actual */}
          {isEmployee && currentUserEmployee && (
            <div className={`mb-6 bg-gradient-to-r ${getEmployeeMotivationalMessage(currentUserEmployee).color} rounded-xl p-6 text-white shadow-lg border-2 border-white/50`}>
              <div className="flex items-start gap-4">
                <div className="text-5xl">{getEmployeeMotivationalMessage(currentUserEmployee).icon}</div>
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-bold">
                    {getEmployeeMotivationalMessage(currentUserEmployee).title}
                  </h3>
                  <p className="mb-4 text-white/90">
                    {getEmployeeMotivationalMessage(currentUserEmployee).message}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <IoFlame className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-white/80">Tus ventas</p>
                        <p className="text-xl font-bold">{currentUserEmployee.sales}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <span className="text-lg">💰</span>
                      <div>
                        <p className="text-xs text-white/80">Tus ingresos</p>
                        <p className="text-xl font-bold">${(currentUserEmployee.revenue / 1000).toFixed(0)}k</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de empleados */}
          <div className="space-y-3">
            {employeeRankings.map((employee, index) => {
              const isCurrentUser = isEmployee && employee.currentUser === true
              
              return (
                <div
                  key={`${employee.name}-${employee.lastName}-${employee.position}`}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    ${isCurrentUser ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 ring-2 ring-blue-300 ring-offset-2' :
                      index === 0 ? 'bg-amber-50/50 border-amber-200' : 
                      index === 1 ? 'bg-slate-50/50 border-slate-200' : 
                      index === 2 ? 'bg-orange-50/50 border-orange-200' : 
                      'bg-gray-50/50 border-gray-200 hover:border-[#f74116]/30'}
                  `}
                >
                  {/* Fila superior: posición + nombre + badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`flex items-center justify-center w-11 h-11 rounded-full text-base font-bold text-white bg-gradient-to-br ${getPositionColor(employee.position)}`}
                      >
                        {employee.position}
                      </div>
                      {getMedalEmoji(employee.position) && (
                        <div className="absolute text-xl -top-1 -right-1">
                          {getMedalEmoji(employee.position)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {employee.name} {employee.lastName}
                        </h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-200 rounded-full flex-shrink-0">
                            🌟 Tú
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {employee.position === 1 ? 'Empleado del Mes' : `Posición #${employee.position}`}
                      </p>
                    </div>
                  </div>

                  {/* Fila inferior: estadísticas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg">
                      <IoFlame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">Ventas</p>
                        <p className="text-base font-bold text-gray-900">{employee.sales}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg">
                      <span className="text-sm flex-shrink-0">💰</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">Ingresos</p>
                        <p className="text-base font-bold text-gray-900 truncate">
                          ${employee.revenue.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Barra de progreso para top 3 */}
                {employee.position <= 3 && (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full bg-gradient-to-r ${getPositionColor(employee.position)} transition-all duration-500`}
                        style={{ width: `${(employee.sales / employeeRankings[0].sales) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )
            })}
          </div>

          {/* Mensaje motivacional para empleados */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💪</div>
              <div>
                <h4 className="mb-1 font-semibold text-gray-900">
                  ¡Sigue mejorando tu rendimiento!
                </h4>
                <p className="text-sm text-gray-700">
                  Cada venta que realizas contribuye tanto a tu posición en el ranking de empleados como a la posición del negocio en el ranking público. ¡Trabajemos juntos para llegar a la cima!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card informativa sobre el ranking público */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-[#f74116]/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#f74116]/10 to-[#f74116]/20">
              <IoTrendingUp className="w-6 h-6 text-[#f74116]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                ¿Sabías que hay un ranking público?
              </h3>
              <p className="mb-3 text-sm text-gray-600">
                Todos los negocios compiten en un ranking público mensual. Cuantas más ventas realice tu equipo, mejor será la posición y visibilidad de tu negocio.
              </p>
              <button 
                onClick={() => window.open('/ranking', '_blank')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f74116] hover:text-[#f74116]/80 transition-colors group"
              >
                Ver ranking público
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
