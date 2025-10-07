import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthProvider";
import SoloAdmin from '../components/SoloAdmin';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Componente Card reutilizable
const Card = ({ title, children, className = "" }) => (
  <div className={`card bg-base-200 shadow-xl ${className}`}>
    <div className="card-body">
      <h2 className="card-title text-2xl mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

// Componente Modal reutilizable
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
        <div className="modal-action">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

// Componente para mostrar formatos en lista
const FormatoItem = ({ formato, onEdit }) => (
  <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg hover:bg-base-300 transition-colors">
    <div className="flex-1">
      <div className="font-semibold text-lg">{formato.nombre}</div>
      <div className="text-sm opacity-70">
        {formato.cantidadJugadores} jugadores
        {formato.formatosEtapasIDs?.length > 0 && ` • ${formato.formatosEtapasIDs.join(', ')}`}
      </div>
    </div>
    <button className="btn btn-sm btn-primary" onClick={() => onEdit(formato)}>
      Editar
    </button>
  </div>
);

// Componente para mostrar etapas en lista
const EtapaItem = ({ etapa, onEdit }) => (
  <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg hover:bg-base-300 transition-colors">
    <div className="flex-1">
      <div className="font-semibold">{etapa.tipoEtapa}</div>
      {etapa.descripcion && <div className="text-sm opacity-70">{etapa.descripcion}</div>}
      <div className="text-xs opacity-50 mt-1">ID: {etapa.id}</div>
    </div>
    <button className="btn btn-sm btn-primary" onClick={() => onEdit(etapa)}>
      Editar
    </button>
  </div>
);

export default function CrearCampeonato() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formatos, setFormatos] = useState([]);
  const [formatoData, setFormatoData] = useState(null);
  const [formatosEtapas, setFormatosEtapas] = useState([]);
  const [loadingFormatos, setLoadingFormatos] = useState(false);
  const [precargaLoading, setPrecargaLoading] = useState(false);
  const [precargaError, setPrecargaError] = useState(null);
  const [contadorFederados, setContadorFederados] = useState(null);

  const [form, setForm] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    inicio: '',
    fin: '',
    ultimaPosicionJugable: 1,
    formatoCampeonatoID: '',
    requisitosParticipacion: { 
      genero: 'ambos', 
      edadDesde: '', 
      edadHasta: '', 
      rankingDesde: '', 
      rankingHasta: '' 
    },
    dobles: false,
    esTenis: true,
  });

  const defaultFormatoTemplate = {
    id: '',
    nombre: '',
    cantidadJugadores: 16,
    formatosEtapasIDs: [],
  };

  const [editingFormato, setEditingFormato] = useState(null);
  const [editingEtapa, setEditingEtapa] = useState(null);
  const [activeTab, setActiveTab] = useState('campeonato');

  useEffect(() => {
    fetchFormatos();
    fetchFormatosEtapas();
  }, []);

  async function fetchFormatos() {
    setLoadingFormatos(true);
    try {
      const res = await fetch(`${API_BASE}/formatos`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error fetching formatos');
      const data = await res.json();
      setFormatos(data || []);
    } catch (err) {
      console.error('fetchFormatos error', err);
    } finally {
      setLoadingFormatos(false);
    }
  }

  async function fetchFormatosEtapas() {
    try {
      const res = await fetch(`${API_BASE}/formatos/etapas`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error fetching formatos etapas');
      const data = await res.json();
      setFormatosEtapas(data || []);
    } catch (err) {
      console.error('fetchFormatosEtapas error', err);
    }
  }

  async function handlePrecarga() {
    setPrecargaLoading(true);
    setPrecargaError(null);
    try {
      const res = await fetch(`${API_BASE}/formatos/precarga`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Error al precargar formatos');
      await fetchFormatos();
    } catch (err) {
      setPrecargaError(err.message || String(err));
    } finally {
      setPrecargaLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    console.log(name, type, value)
    if (name.startsWith('req.')) {
      const key = name.slice(4);
      setForm(s => ({ ...s, requisitosParticipacion: { ...s.requisitosParticipacion, [key]: value } }));
    } else if (type === 'checkbox') {
      setForm(s => ({ ...s, [name]: checked }));
    } else {
      setForm(s => ({ ...s, [name]: value }));
    }
    if(name === "formatoCampeonatoID"){
      setFormatoData(formatos.find(el => el.id === value));
    }
  }

  async function consultarCantidadFederados() {
    try {
      const params = new URLSearchParams();
      params.append('genero', form.requisitosParticipacion.genero || 'ambos');
      if (form.requisitosParticipacion.edadDesde) params.append('edadDesde', form.requisitosParticipacion.edadDesde);
      if (form.requisitosParticipacion.edadHasta) params.append('edadHasta', form.requisitosParticipacion.edadHasta);
      const res = await fetch(`${API_BASE}/campeonatos/federados/count?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error consultando cantidad');
      const data = await res.json();
      setContadorFederados(data.cantidad);
    } catch (err) {
      console.error('consultarCantidadFederados err', err);
      alert(err.message || String(err));
    }
  }

  function openNewFormato() {
    setEditingFormato({ ...defaultFormatoTemplate });
  }

  function openEditFormato(f) {
    setEditingFormato({ ...f });
  }

  async function saveFormato(e) {
    e.preventDefault();
    if (!editingFormato) return;
    try {
      const payload = { ...editingFormato };
      const method = payload.id ? 'PUT' : 'POST';
      const idSegment = payload.id ? `/${payload.id}` : '';
      const res = await fetch(`${API_BASE}/formatos${idSegment}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error saving formato');
      }
      setEditingFormato(null);
      await fetchFormatos();
    } catch (err) {
      console.error('saveFormato err', err);
      alert(err.message || String(err));
    }
  }

  function openNewEtapa() {
    setEditingEtapa({ id: '', tipoEtapa: '', descripcion: '' });
  }

  function openEditEtapa(et) {
    setEditingEtapa({ ...et });
  }

  async function saveEtapa(e) {
    e.preventDefault();
    if (!editingEtapa) return;
    try {
      const payload = { ...editingEtapa };
      const method = payload.id ? 'PUT' : 'POST';
      const idSegment = payload.id ? `/${payload.id}` : '';
      const res = await fetch(`${API_BASE}/formatos/etapas${idSegment}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error saving etapa');
      }
      setEditingEtapa(null);
      await fetchFormatosEtapas();
    } catch (err) {
      console.error('saveEtapa err', err);
      alert(err.message || String(err));
    }
  }

  async function createCampeonato(e) {
    e.preventDefault();
    if (!user || user.rol !== 'administrador') return alert('No autorizado');
    try {
      const requisitos = { ...form.requisitosParticipacion };
      ['edadDesde','edadHasta','rankingDesde','rankingHasta'].forEach(k => {
        if (typeof requisitos[k] === 'string' && requisitos[k] !== '') requisitos[k] = Number(requisitos[k]);
        if (requisitos[k] === '') requisitos[k] = null;
      });
      const payload = { ...form, requisitosParticipacion: requisitos };
      const res = await fetch(`${API_BASE}/campeonatos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Error creando campeonato');
      }
      const saved = await res.json();
      navigate(`/campeonatos/${saved.id}`);
    } catch (err) {
      console.error('createCampeonato err', err);
      alert(err.message || String(err));
    }
  }

  if (!user || user.rol !== 'administrador') {
    return <SoloAdmin />;
  }

  return (
    <div className="min-h-screen bg-base-300 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Crear Campeonato</h1>
          <p className="text-base-content/70">Configure todos los detalles del nuevo campeonato</p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6 bg-base-200 p-1">
          <a 
            className={`tab tab-lg ${activeTab === 'campeonato' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('campeonato')}
          >
            📋 Campeonato
          </a>
          <a 
            className={`tab tab-lg ${activeTab === 'formatos' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('formatos')}
          >
            🏆 Gestión de Formatos
          </a>
          <a 
            className={`tab tab-lg ${activeTab === 'etapas' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('etapas')}
          >
            📊 Gestión de Etapas
          </a>
        </div>

        {/* Tab Content - Campeonato */}
        {activeTab === 'campeonato' && (
          <form onSubmit={createCampeonato} className="space-y-6">
            {/* Datos Básicos */}
            <Card title="📝 Datos Básicos">
              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nombre del Campeonato</span>
                  </label>
                  <input 
                    name="nombre" 
                    value={form.nombre} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    placeholder="Ej: Torneo Nacional de Verano 2024"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Descripción</span>
                  </label>
                  <textarea 
                    name="descripcion" 
                    value={form.descripcion} 
                    onChange={handleChange} 
                    className="textarea textarea-bordered w-full h-24" 
                    placeholder="Describe el campeonato..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">📅 Fecha de Inicio</span>
                    </label>
                    <input 
                      type="date" 
                      name="inicio" 
                      value={form.inicio} 
                      onChange={handleChange} 
                      className="input input-bordered w-full" 
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">📅 Fecha de Fin</span>
                    </label>
                    <input 
                      type="date" 
                      name="fin" 
                      value={form.fin} 
                      onChange={handleChange} 
                      className="input input-bordered w-full" 
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input 
                      type="checkbox" 
                      name="dobles" 
                      checked={form.dobles} 
                      onChange={handleChange} 
                      className="checkbox checkbox-primary" 
                    />
                    <span className="label-text font-semibold">🧑‍🤝‍🧑 Campeonato de Dobles</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="swap swap-rotate text-4xl cursor-pointer">
                    <input
                      type="checkbox"
                      name="esTenis"
                      checked={form.esTenis}
                      onChange={handleChange}
                    />

                    {/* Tenis */}
                    <div className="swap-on">🎾</div>

                    {/* Pádel */}
                    <div className="swap-off">🥎</div>
                  </label>

                  <span className="text-lg font-medium">
                    {form.esTenis ? 'Tenis' : 'Pádel'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Requisitos de Participación */}
            <Card title="👥 Requisitos de Participación">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Género</span>
                  </label>
                  <select 
                    name="req.genero" 
                    value={form.requisitosParticipacion.genero} 
                    onChange={handleChange} 
                    className="select select-bordered w-full"
                  >
                    <option value="ambos">Ambos</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>
                <div></div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Edad Mínima</span>
                  </label>
                  <input 
                    type="number" 
                    name="req.edadDesde" 
                    value={form.requisitosParticipacion.edadDesde} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    placeholder="Ej: 18" 
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Edad Máxima</span>
                  </label>
                  <input 
                    type="number" 
                    name="req.edadHasta" 
                    value={form.requisitosParticipacion.edadHasta} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    placeholder="Ej: 35" 
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Ranking Mínimo</span>
                  </label>
                  <input 
                    type="number" 
                    name="req.rankingDesde" 
                    value={form.requisitosParticipacion.rankingDesde} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    placeholder="Ej: 1" 
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Ranking Máximo</span>
                  </label>
                  <input 
                    type="number" 
                    name="req.rankingHasta" 
                    value={form.requisitosParticipacion.rankingHasta} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    placeholder="Ej: 100" 
                  />
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex flex-col gap-3">
                <button 
                  type="button" 
                  className="btn btn-outline btn-info w-full md:w-auto"
                  onClick={consultarCantidadFederados}
                >
                  🔍 Consultar Federados Disponibles
                </button>
                {contadorFederados !== null && (
                  <div className="alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span><strong>{contadorFederados}</strong> federados cumplen con los requisitos</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Formato */}
            <Card title="🏆 Formato del Campeonato">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Seleccionar Formato</span>
                </label>
                <div className="flex gap-2">
                  <select 
                    name="formatoCampeonatoID" 
                    value={form.formatoCampeonatoID} 
                    onChange={handleChange} 
                    className="select select-bordered flex-1"
                    required
                  >
                    <option value="">-- Seleccionar formato --</option>
                    {formatos.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nombre} ({f.cantidadJugadores} jugadores)
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('formatos')}
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm opacity-70">¿No encuentras los formatos que buscas?</span>
                <button 
                  className="btn btn-sm btn-outline btn-secondary" 
                  onClick={handlePrecarga} 
                  disabled={precargaLoading} 
                  type="button"
                >
                  {precargaLoading ? 'Precargando...' : '⬇️ Precargar Formatos'}
                </button>
              </div>
              {precargaError && (
                <div className="alert alert-error mt-2">
                  <span>{precargaError}</span>
                </div>
              )}

              {formatoData && (
                <div className="alert alert-info mt-4">
                  <div>
                    <div className="font-semibold">{formatoData.nombre}</div>
                    <div className="text-sm">Jugadores: {formatoData.cantidadJugadores}</div>
                    {formatoData.formatosEtapasIDs?.length > 0 && (
                      <div className="text-sm">Etapas: {formatoData.formatosEtapasIDs.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Botones de acción */}
            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => navigate('/campeonatos')}
              >
                Cancelar
              </button>
              <button className="btn btn-primary btn-lg" type="submit">
                ✅ Crear Campeonato
              </button>
            </div>
          </form>
        )}

        {/* Tab Content - Gestión de Formatos */}
        {activeTab === 'formatos' && (
          <div className="space-y-6">
            <Card title="🏆 Gestión de Formatos">
              <div className="flex justify-between items-center mb-4">
                <p className="text-base-content/70">Administra los formatos de campeonato disponibles</p>
                <button className="btn btn-primary" onClick={openNewFormato}>
                  + Nuevo Formato
                </button>
              </div>

              {loadingFormatos ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : formatos.length === 0 ? (
                <div className="alert">
                  <span>No hay formatos disponibles. Crea uno nuevo o precarga los formatos predeterminados.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {formatos.map(f => (
                    <FormatoItem key={f.id} formato={f} onEdit={openEditFormato} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab Content - Gestión de Etapas */}
        {activeTab === 'etapas' && (
          <div className="space-y-6">
            <Card title="📊 Gestión de Etapas">
              <div className="flex justify-between items-center mb-4">
                <p className="text-base-content/70">Administra los tipos de etapas para los formatos</p>
                <button className="btn btn-primary" onClick={openNewEtapa}>
                  + Nueva Etapa
                </button>
              </div>

              {formatosEtapas.length === 0 ? (
                <div className="alert">
                  <span>No hay etapas disponibles. Crea una nueva.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {formatosEtapas.map(et => (
                    <EtapaItem key={et.id} etapa={et} onEdit={openEditEtapa} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Modal Formato */}
        <Modal 
          isOpen={!!editingFormato} 
          onClose={() => setEditingFormato(null)}
          title={editingFormato?.id ? '✏️ Editar Formato' : '➕ Nuevo Formato'}
        >
          <form onSubmit={saveFormato} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">ID (clave única)</span>
              </label>
              <input 
                value={editingFormato?.id || ''} 
                onChange={e => setEditingFormato(s => ({ ...s, id: e.target.value }))} 
                className="input input-bordered w-full"
                placeholder="Ej: eliminacion-directa-16"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nombre</span>
              </label>
              <input 
                value={editingFormato?.nombre || ''} 
                onChange={e => setEditingFormato(s => ({ ...s, nombre: e.target.value }))} 
                className="input input-bordered w-full"
                placeholder="Ej: Eliminación Directa 16 Jugadores"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Cantidad de Jugadores</span>
              </label>
              <input 
                type="number" 
                value={editingFormato?.cantidadJugadores || 16} 
                onChange={e => setEditingFormato(s => ({ ...s, cantidadJugadores: Number(e.target.value) }))} 
                className="input input-bordered w-full"
                min="2"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Etapas del Formato</span>
              </label>
              <select 
                className="select select-bordered mb-2" 
                onChange={e => {
                  const v = e.target.value;
                  if (!v) return;
                  setEditingFormato(s => ({ 
                    ...s, 
                    formatosEtapasIDs: Array.from(new Set([...(s.formatosEtapasIDs||[]), v])) 
                  }));
                  e.target.value = '';
                }}
              >
                <option value="">-- Añadir etapa --</option>
                {formatosEtapas.map(fe => (
                  <option key={fe.id} value={fe.id}>
                    {fe.tipoEtapa} ({fe.id})
                  </option>
                ))}
              </select>

              {(editingFormato?.formatosEtapasIDs?.length || 0) > 0 && (
                <div className="space-y-2">
                  {editingFormato.formatosEtapasIDs.map((id, idx) => {
                    const meta = formatosEtapas.find(x => x.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-neutral">{idx + 1}</span>
                          <span>{meta ? `${meta.tipoEtapa}` : id}</span>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-xs btn-error" 
                          onClick={() => setEditingFormato(s => ({ 
                            ...s, 
                            formatosEtapasIDs: (s.formatosEtapasIDs||[]).filter(x => x !== id) 
                          }))}
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button type="button" className="btn btn-ghost" onClick={() => setEditingFormato(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                💾 Guardar Formato
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Etapa */}
        <Modal 
          isOpen={!!editingEtapa} 
          onClose={() => setEditingEtapa(null)}
          title={editingEtapa?.id ? '✏️ Editar Etapa' : '➕ Nueva Etapa'}
        >
          <form onSubmit={saveEtapa} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">ID (clave única)</span>
              </label>
              <input 
                value={editingEtapa?.id || ''} 
                onChange={e => setEditingEtapa(s => ({ ...s, id: e.target.value }))} 
                className="input input-bordered w-full"
                placeholder="Ej: octavos-final"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Tipo de Etapa</span>
              </label>
              <input 
                value={editingEtapa?.tipoEtapa || ''} 
                onChange={e => setEditingEtapa(s => ({ ...s, tipoEtapa: e.target.value }))} 
                className="input input-bordered w-full"
                placeholder="Ej: Octavos de Final"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Descripción</span>
              </label>
              <textarea 
                value={editingEtapa?.descripcion || ''} 
                onChange={e => setEditingEtapa(s => ({ ...s, descripcion: e.target.value }))} 
                className="textarea textarea-bordered w-full"
                placeholder="Describe esta etapa del campeonato..."
                rows="3"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button type="button" className="btn btn-ghost" onClick={() => setEditingEtapa(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                💾 Guardar Etapa
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}