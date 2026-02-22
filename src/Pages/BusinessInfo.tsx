import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/useAuth'
import { businessService, type BusinessDetailResponse, type BusinessMemberDetailResponse } from '../services/businessService'
import { IoCopyOutline, IoCheckmarkCircle, IoBusinessOutline, IoCodeSlashOutline, IoPeopleOutline, IoPersonOutline, IoSaveOutline, IoCloseOutline, IoInformationCircleOutline, IoShareOutline, IoPencilOutline } from 'react-icons/io5'
import LoadingScreen from '../components/LoadingScreen'

function BusinessInfo() {
  const { user } = useAuth()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [businessDetail, setBusinessDetail] = useState<BusinessDetailResponse | null>(null)
  const [employees, setEmployees] = useState<BusinessMemberDetailResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE' | 'PENDING'>('ACTIVE')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const businessId = user?.businessId
  const status = user?.status
  const role = user?.role

  // Cargar detalles del negocio
  useEffect(() => {
    const loadBusinessDetail = async () => {
      if (!businessId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const detail = await businessService.getBusinessDetail(businessId)
        setBusinessDetail(detail)
        
        // Cargar empleados después de cargar los detalles del negocio
        await loadEmployees(businessId)
      } catch (err) {
        console.error('Error cargando detalles del negocio:', err)
        setError('Error al cargar la información del negocio')
      } finally {
        setLoading(false)
      }
    }

    const loadEmployees = async (businessId: string) => {
      try {
        setEmployeesLoading(true)
        const employeesData = await businessService.getBusinessEmployees(businessId)
        setEmployees(employeesData || [])
      } catch (err) {
        console.error('Error cargando empleados:', err)
        setEmployees([]) // Asegurar que employees sea un array vacío en caso de error
      } finally {
        setEmployeesLoading(false)
      }
    }

    loadBusinessDetail()
  }, [businessId])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000) // Resetear después de 2 segundos
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
    }
  }

  const handleEditStatus = (employeeId: string, currentStatus: string) => {
    setEditingEmployeeId(employeeId)
    setNewStatus(currentStatus as 'ACTIVE' | 'INACTIVE' | 'PENDING')
  }

  const handleSaveStatus = async (employeeId: string) => {
    if (!businessId) return

    try {
      setUpdatingStatus(true)
      await businessService.updateMemberStatus(businessId, employeeId, newStatus)
      
      // Actualizar el estado local
      setEmployees(prev => 
        prev.map(emp => 
          emp.userId === employeeId 
            ? { ...emp, status: newStatus }
            : emp
        )
      )
      
      setEditingEmployeeId(null)
    } catch (err) {
      console.error('Error al actualizar estado del empleado:', err)
      // Aquí podrías mostrar un toast o mensaje de error
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingEmployeeId(null)
  }

  // Verificar si el usuario actual es owner y puede editar estados
  const canEditStatus = user?.role === 'OWNER'

  if (loading) {
    return <LoadingScreen message="Cargando información del negocio..." />
  }

  if (error || !user || !businessDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {error ? 'Error al cargar información' : 'Sin información de negocio'}
          </h2>
          <p className="text-gray-600">
            {error || 'No se encontró información del negocio asociado a tu cuenta.'}
          </p>
          {error && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-[#f74116] text-white rounded-lg hover:bg-[#f74116]/90 transition-colors"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff1eb] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Mejorado */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f74116]/10 px-4 py-2 text-sm font-semibold text-[#f74116] mb-4">
            <span className="h-2 w-2 rounded-full bg-[#f74116]" />
            Información del Negocio
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {businessDetail?.name}
              </h1>
              <p className="text-gray-600 mt-2">
                {role === 'OWNER' 
                  ? '🏢 Gestiona la información y empleados de tu negocio'
                  : '👋 Información del negocio donde trabajas'
                }
              </p>
            </div>
            
            {/* Estadísticas Rápidas */}
            <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-[#f74116]/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#f74116]">{businessDetail?.stats?.totalProducts || 0}</div>
                <div className="text-xs text-gray-500 font-medium">Productos</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{businessDetail?.stats?.totalMembers || 0}</div>
                <div className="text-xs text-gray-500 font-medium">Empleados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Información Principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 mb-8 overflow-hidden">
          {/* Header simplificado */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#f74116]/5 to-[#f74116]/10 border-b border-[#f74116]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f74116]/10 rounded-xl flex items-center justify-center">
                <IoBusinessOutline className="w-5 h-5 text-[#f74116]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Datos del Negocio</h2>
                <p className="text-sm text-gray-500">Información esencial de tu establecimiento</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Columna Izquierda - Información Principal */}
              <div className="space-y-6">
                {/* Nombre del Negocio */}
                <div className="group">
                  <div className="flex items-center gap-2 mb-3">
                    <IoBusinessOutline className="text-lg text-gray-500" />
                    <label className="text-sm font-semibold text-gray-700">Nombre del Negocio</label>
                  </div>
                  <div className="relative">
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200 group-hover:border-[#f74116]/20 transition-colors">
                      <p className="text-lg font-medium text-gray-900 pr-12">{businessDetail.name}</p>
                    </div>
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#f74116] hover:bg-[#f74116]/10 rounded-lg transition-all duration-200"
                      onClick={() => copyToClipboard(businessDetail.name, 'name')}
                      title="Copiar nombre"
                    >
                      {copiedField === 'name' ? (
                        <IoCheckmarkCircle className="text-lg text-green-600" />
                      ) : (
                        <IoCopyOutline className="text-lg" />
                      )}
                    </button>
                  </div>
                  {copiedField === 'name' && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 transition-all duration-300 ease-in-out">
                      <IoCheckmarkCircle className="text-sm" />
                      <span className="text-sm font-medium">Nombre copiado exitosamente</span>
                    </div>
                  )}
                </div>

                {/* Código del Negocio */}
                <div className="group">
                  <div className="flex items-center gap-2 mb-3">
                    <IoCodeSlashOutline className="text-lg text-gray-500" />
                    <label className="text-sm font-semibold text-gray-700">Código de Acceso</label>
                  </div>
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-r from-[#f74116]/5 to-[#f74116]/10 rounded-xl border border-[#f74116]/20 group-hover:border-[#f74116]/30 transition-colors">
                      <p className="font-mono text-xl font-bold tracking-wider text-[#f74116] pr-12">{businessDetail.joinCode}</p>
                      <p className="text-xs text-[#f74116]/80 mt-1">Comparte este código con empleados para que se unan</p>
                    </div>
                    <button
                      className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center text-[#f74116] hover:text-[#f74116]/80 hover:bg-white/80 rounded-lg transition-all duration-200"
                      onClick={() => copyToClipboard(businessDetail.joinCode, 'code')}
                      title="Copiar código"
                    >
                      {copiedField === 'code' ? (
                        <IoCheckmarkCircle className="text-lg text-green-600" />
                      ) : (
                        <IoCopyOutline className="text-lg" />
                      )}
                    </button>
                  </div>
                  {copiedField === 'code' && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 transition-all duration-300 ease-in-out">
                      <IoCheckmarkCircle className="text-sm" />
                      <span className="text-sm font-medium">Código copiado para compartir</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha - Estado y Configuración */}
              <div className="space-y-6">
                {/* Estado y Rol */}
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu Información</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Estado de cuenta</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-sm font-semibold ${
                          status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Rol en el negocio</span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold text-[#f74116] bg-[#f74116]/10 rounded-full">
                        {role === 'OWNER' ? '👑 Propietario' : '🔧 Empleado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nota informativa mejorada */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <IoInformationCircleOutline className="text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">💡 Consejo útil</h3>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Tu código de negocio es único y permite que nuevos empleados se unan automáticamente. 
                        Compártelo solo con personas de confianza.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Empleados Mejorada */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#f74116]/10 overflow-hidden">
          {/* Header de empleados con acciones */}
          <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <IoPeopleOutline className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Equipo de Trabajo</h2>
                  <p className="text-sm text-gray-600">
                    {employees.length === 0 
                      ? 'Invita empleados para que se unan a tu negocio'
                      : `${employees.length} miembro${employees.length !== 1 ? 's' : ''} en tu equipo`
                    }
                  </p>
                </div>
              </div>
              
              {employees.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-600">
                        {employees.filter(emp => emp.status === 'ACTIVE').length} activos
                      </span>
                    </div>
                    {employees.filter(emp => emp.status === 'PENDING').length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-gray-600">
                          {employees.filter(emp => emp.status === 'PENDING').length} pendientes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {employeesLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Cargando información del equipo...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <IoPeopleOutline className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">¡Construye tu equipo!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                  Comparte tu código de negocio con empleados para que puedan unirse y comenzar a trabajar contigo.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f74116] to-[#e63912] text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
                     onClick={() => copyToClipboard(businessDetail.joinCode, 'code')}>
                  <IoShareOutline className="w-4 h-4" />
                  Compartir código de acceso
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lista de empleados mejorada */}
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div
                      key={employee.userId}
                      className="group relative p-5 bg-gray-50/30 rounded-xl hover:bg-gray-50/60 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm transform hover:scale-[1.01]"
                    >
                      {/* Fila superior: avatar + info + botón editar (view mode) */}
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                            <IoPersonOutline className="text-lg text-gray-600 group-hover:text-blue-600" />
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            employee.status === 'ACTIVE' 
                              ? 'bg-green-500' 
                              : employee.status === 'PENDING'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h4 className="text-base font-semibold text-gray-900 truncate">
                              {(employee.userName && employee.userLastName) 
                                ? `${employee.userName} ${employee.userLastName}` 
                                : employee.userName || 'Sin nombre'
                              }
                            </h4>
                            {employee.role === 'OWNER' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full flex-shrink-0">
                                👑 Propietario
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-0.5">{employee.userEmail}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="capitalize font-medium">{employee.role.toLowerCase()}</span>
                            <span>•</span>
                            <span className={`font-medium ${
                              employee.status === 'ACTIVE' 
                                ? 'text-green-600' 
                                : employee.status === 'PENDING'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {employee.status === 'ACTIVE' 
                                ? 'Activo' 
                                : employee.status === 'PENDING'
                                ? 'Pendiente'
                                : 'Inactivo'}
                            </span>
                          </div>
                        </div>

                        {/* Botón editar (solo en view mode) */}
                        {editingEmployeeId !== employee.userId && canEditStatus && employee.userId !== user?.userId && (
                          <button
                            onClick={() => handleEditStatus(employee.userId, employee.status)}
                            className="flex-shrink-0 flex items-center justify-center w-9 h-9 text-gray-400 hover:text-[#f74116] hover:bg-[#f74116]/10 rounded-lg transition-all duration-200"
                            title="Editar estado del empleado"
                          >
                            <IoPencilOutline className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Fila de edición (debajo, ancho completo) */}
                      {editingEmployeeId === employee.userId && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | 'PENDING')}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f74116]/20 focus:border-[#f74116] bg-white"
                            disabled={updatingStatus}
                          >
                            <option value="ACTIVE">✅ Activo</option>
                            <option value="INACTIVE">❌ Inactivo</option>
                            <option value="PENDING">⏳ Pendiente</option>
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveStatus(employee.userId)}
                              disabled={updatingStatus}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {updatingStatus ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <IoSaveOutline className="w-4 h-4" />
                              )}
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updatingStatus}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <IoCloseOutline className="w-4 h-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Información adicional para propietarios */}
                {canEditStatus && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <IoInformationCircleOutline className="text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">💼 Panel de administración</h3>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          Como propietario, puedes gestionar el estado de tus empleados. 
                          Usa "Pendiente" para nuevas solicitudes y "Activo/Inactivo" para gestionar accesos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessInfo