import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
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
      <div className="modal-box max-w-2xl bg-white">
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
const FormatoItem = ({ formato, onEdit, dobles = false }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-lg transition-colors">
    <div className="flex-1">
      <div className="font-semibold text-lg">{formato.nombre}</div>
      <div className="text-sm opacity-70">
        {formato.cantidadJugadores} {dobles ? 'equipos' : 'jugadores'}
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
  <div className="flex items-center justify-between p-4 bg-white rounded-lg transition-colors">
    <div className="flex-1 bg-white">
      <div className="font-semibold">{etapa.id}</div>
      <div className="text-xs opacity-50 mt-1">Tipo: {etapa.tipoEtapa}</div>
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
  const [temporada, setTemporada] = useState(null);

  const fetchTemporadas = async () => {
    try {
      const res = await fetch(`${API_BASE}/temporadas`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error fetching temporadas');
      const data = await res.json();
      setTemporada(data || null);

      console.log("Fetched temporada:", data);
    } catch (err) {
      console.error('fetchTemporada error', err);
    }
  }

  const [form, setForm] = useState({
    id: '',
    nombre: '',
    cantidadParticipantes: 16,
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
    temporadaID: '',
  });
  // reglamento PDF file (opcional)
  const [reglamentoFile, setReglamentoFile] = useState(null);

  // Configuración dinámica de las etapas del formato seleccionado
  const [etapasConfig, setEtapasConfig] = useState([]);
  const [etapasErrors, setEtapasErrors] = useState([]);

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
    fetchTemporadas();
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
      await fetchFormatosEtapas();
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
    if (name === "formatoCampeonatoID") {
      setFormatoData(formatos.find(el => el.id === value));
      const formato = formatos.find(el => el.id === value);
      if (formato) {
        // set default participants to formato value
        setForm(s => ({ ...s, cantidadParticipantes: formato.cantidadJugadores }));
        // initialize etapasConfig from formatosEtapas metadata
        const etapaIds = formato.formatosEtapasIDs || [];
        const cfg = etapaIds.map((id, idx) => {
          const meta = formatosEtapas.find(fe => fe.id === id) || {};
          return {
            id: id,
            nombre: meta.tipoEtapa || id,
            tipoEtapa: meta.tipoEtapa || '',
            cantidadDeJugadoresFin: meta.cantidadDeJugadoresFin || '',
            duracionDias: meta.duracionDias || '',
          };
        });
        setEtapasConfig(cfg);
      } else {
        setEtapasConfig([]);
      }
    }

    if (form.inicio) {
      // removed fin calculation from here to avoid stale state issues;
      // fin will be computed in a dedicated useEffect when inicio or etapasConfig change
    }
  }

  // Handle changes in etapa inputs
  function handleEtapaChange(index, field, value) {
    setEtapasConfig(s => {
      const copy = [...s];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    // fin will be recalculated by the effect that watches etapasConfig and form.inicio
  }

  // Compute preview: fechaFin per etapa based on inicio and cumulative durations
  function computeEtapasPreview() {
    const inicioStr = form.inicio;
    const preview = [];
    if (!inicioStr) {
      return etapasConfig.map(() => ({ fechaFin: null }));
    }
    const inicioDate = new Date(inicioStr + 'T00:00:00');
    if (isNaN(inicioDate.getTime())) return etapasConfig.map(() => ({ fechaFin: null }));
    let cumulative = 0;
    for (let i = 0; i < etapasConfig.length; i++) {
      const dur = Number(etapasConfig[i].duracionDias) || 0;
      cumulative += dur;
      const fin = new Date(inicioDate);
      fin.setDate(fin.getDate() + cumulative);
      // provide both a user-friendly and ISO date for downstream use
      preview.push({ fechaFin: fin.toLocaleDateString(), isoFin: fin.toISOString().split('T')[0], finDate: fin });
    }
    return preview;
  }

  // Keep form.fin in sync with inicio + etapasConfig durations
  useEffect(() => {
    if (!form.inicio) {
      setForm(s => ({ ...s, fin: '' }));
      return;
    }
    const preview = computeEtapasPreview();
    if (!preview || preview.length === 0) {
      // no etapas: set fin = inicio
      setForm(s => ({ ...s, fin: form.inicio }));
      return;
    }
    const last = preview[preview.length - 1];
    if (last && last.isoFin) {
      setForm(s => ({ ...s, fin: last.isoFin }));
    } else if (last && last.fechaFin) {
      setForm(s => ({ ...s, fin: last.fechaFin }));
    }
  }, [form.inicio, etapasConfig]);

  // Validate etapas: each etapa.cantidadDeJugadoresFin must be >= 0
  // and strictly less than previous etapa's cantidad (or than initial players for first etapa)
  function validateEtapas(cfg, initialPlayers) {
    const errors = cfg.map((et, idx) => {
      const msgs = [];
      const raw = et.cantidadDeJugadoresFin;
      const cant = raw === '' || raw == null ? NaN : Number(raw);
      if (isNaN(cant)) {
        msgs.push('Cantidad inválida');
      } else {
        if (cant < 0) msgs.push('La cantidad no puede ser menor que 0');
        if (idx === 0) {
          const initial = Number(initialPlayers) || 0;
          if (!(initial > cant)) msgs.push(`Debe ser menor que ${form.dobles ? 'equipos' : 'jugadores'} iniciales (${initial})`);
          // If this etapa is an elimination stage, the initial must be one of allowed sizes
          if ((et.tipoEtapa === 'eliminacion' || et.nombre === 'eliminacion') && initial > 0) {
            const allowed = [2, 4, 8, 16, 32, 64];
            if (!allowed.includes(initial)) msgs.push(`Para etapas de eliminación, los ${form.dobles ? 'equipos' : 'jugadores'} iniciales deben ser: ${allowed.join(', ')}`);
          }
        } else {
          const prevRaw = cfg[idx - 1]?.cantidadDeJugadoresFin;
          const prev = prevRaw === '' || prevRaw == null ? NaN : Number(prevRaw);
          if (isNaN(prev)) {
            msgs.push('La etapa anterior no tiene cantidad válida');
          } else if (!(prev > cant)) {
            msgs.push(`Debe ser menor que la etapa anterior (${prev})`);
          }
          // If this etapa is elimination, the "previous" (initial for this etapa) must be allowed size
          if ((et.tipoEtapa === 'eliminacion' || et.nombre === 'eliminacion') && !isNaN(prev)) {
            const allowed = [2, 4, 8, 16, 32, 64];
            if (!allowed.includes(prev)) msgs.push(`Para etapas de eliminación, los ${form.dobles ? 'equipos' : 'jugadores'} iniciales deben ser: ${allowed.join(', ')}`);
          }
        }
      }
      return msgs.join(' • ');
    });
    return errors;
  }

  useEffect(() => {
    if (etapasErrors) {
      const errs = validateEtapas(etapasConfig, form.cantidadParticipantes);
      setEtapasErrors(errs);
    }
  }, [etapasConfig, form.cantidadParticipantes]);

  async function consultarCantidadFederados() {
    try {
      const requisitos = form.requisitosParticipacion || {};
      const params = new URLSearchParams();
      params.append('genero', requisitos.genero || 'ambos');
      if (requisitos.edadDesde !== '') params.append('edadDesde', requisitos.edadDesde);
      if (requisitos.edadHasta !== '') params.append('edadHasta', requisitos.edadHasta);
      if (requisitos.rankingDesde !== '') params.append('rankingDesde', requisitos.rankingDesde);
      if (requisitos.rankingHasta !== '') params.append('rankingHasta', requisitos.rankingHasta);
      params.append('tipoDePartido', form.dobles ? 'dobles' : 'singles');
      params.append('temporada', form.temporadaID || form.temporada || '');
      params.append('deporte', form.esTenis ? 'tenis' : 'padel');
      const res = await fetch(`${API_BASE}/campeonatos-federados/contar?${params.toString()}`, { credentials: 'include' });
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
    setEditingEtapa({ id: '', tipoEtapa: '', cantSets: '', juegosSet: '' });
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
      // re-validate etapas before submit
      const currentErrors = validateEtapas(etapasConfig, form.cantidadParticipantes);
      const any = currentErrors.some(x => x && x.length > 0);
      if (any) {
        setEtapasErrors(currentErrors);
        alert('Corrija las validaciones de las etapas antes de crear el campeonato.');
        return;
      }
      const requisitos = { ...form.requisitosParticipacion };
      ['edadDesde', 'edadHasta', 'rankingDesde', 'rankingHasta'].forEach(k => {
        if (typeof requisitos[k] === 'string' && requisitos[k] !== '') requisitos[k] = Number(requisitos[k]);
        if (requisitos[k] === '') requisitos[k] = null;
      });
      // Validate etapas and prepare payload
      const etapasToSend = etapasConfig.map((et, idx) => {
        if (typeof et.cantidadDeJugadoresFin === 'undefined' || et.cantidadDeJugadoresFin === '') throw new Error(`Etapa ${idx + 1}: cantidad de ${form.dobles ? 'equipos' : 'jugadores'} al finalizar es obligatoria`);
        if (typeof et.duracionDias === 'undefined' || et.duracionDias === '') throw new Error(`Etapa ${idx + 1}: duración (días) es obligatoria`);
        const formatoEtapa = formatosEtapas.filter(el => el.id == et.id)[0];
        return {
          tipoEtapa: formatoEtapa.tipoEtapa,
          cantidadSets: Number(formatoEtapa.cantidadSets),
          juegosPorSet: Number(formatoEtapa.juegosPorSet),
          permitirEmpate: formatoEtapa.permitirEmpate,
          nombre: formatoEtapa.id,
          cantidadDeJugadoresFin: Number(et.cantidadDeJugadoresFin),
          duracionDias: Number(et.duracionDias),
        };
      });

      const cantidadJugadores = formatos.filter(f => f.id == form.formatoCampeonatoID)[0].cantidadJugadores

      const payload = { ...form, requisitosParticipacion: requisitos, etapas: etapasToSend, cantidadJugadores };

      console.log('AAAAAAAAAAAAAAAAA')
      console.log(payload)

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
      // If reglamento file selected, upload it to the reglamento endpoint
      if (reglamentoFile) {
        try {
          const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 20 MB client-side guard
          if (reglamentoFile.size > MAX_UPLOAD_BYTES) {
            alert(`El archivo seleccionado excede el límite de ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`);
          } else {
            const fd = new FormData();
            fd.append('reglamento', reglamentoFile);
            const up = await fetch(`${API_BASE}/campeonato/${saved.id}/reglamento`, {
              method: 'POST',
              credentials: 'include',
              body: fd,
            });
            if (!up.ok) {
              console.warn('No se pudo subir reglamento:', await up.text());
            }
          }
        } catch (e) {
          console.error('Error subiendo reglamento', e);
        }
      }
      navigate(`/campeonato/${saved.id}`);
    } catch (err) {
      console.error('createCampeonato err', err);
      alert(err.message || String(err));
    }
  }

  if (!user || user.rol !== 'administrador') {
    return <SoloAdmin />;
  }

  return (
    <div className="min-h-screen bg-base-300 p-6 mt-12 bg-white">
      <NavbarBlanco />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 text-black text-center">Crear Campeonato</h1>
          <p className="text-base-content/70 text-black text-center">Configure todos los detalles del nuevo campeonato</p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6  p-1 bg-white text-black rounded-lg">
          <a
            className={`tab tab-lg ${activeTab === 'campeonato' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('campeonato')}
            style={{ color: 'var(--neutro)' }}
          >
            📋 Campeonato
          </a>
          <a
            className={`tab tab-lg ${activeTab === 'formatos' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('formatos')}
            style={{ color: 'var(--neutro)' }}
          >
            🏆 Gestión de Formatos
          </a>
          <a
            style={{ color: 'var(--neutro)' }}
            className={`tab tab-lg ${activeTab === 'etapas' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('etapas')}
          >
            📊 Gestión de Etapas
          </a>
        </div>

        {activeTab === 'campeonato' && (
          <form onSubmit={createCampeonato} className="space-y-6">
            <Card title="Datos Básicos" className='bg-white'>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Temporada</span>
                </label>
                <select
                  name="temporadaID"
                  value={form.temporadaID}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-white"
                  required
                >
                  <option value="">-- Selecciona una temporada --</option>
                  {Array.isArray(temporada) && temporada.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.inicio} - {t.fin})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 bg-white">
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

                <div className="form-control bg-white">
                  <label className="label bg-white">
                    <span className="label-text font-semibold">Descripción</span>
                  </label>
                  <textarea

                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    className="textarea textarea-bordered bg-white w-full h-24"
                    placeholder="Describe el campeonato..."
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Reglamento (PDF) - opcional</span>
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      setReglamentoFile(f);
                    }}
                    className="file-input file-input-bordered w-full bg-white"
                  />
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
                    <span className="label-text font-semibold">Campeonato de Dobles</span>
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

                    <div className="swap-on">🎾</div>

                    <div className="swap-off">🥎</div>
                  </label>

                  <span className="text-lg font-medium">
                    {form.esTenis ? 'Tenis' : 'Pádel'}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Requisitos de Participación" className='bg-white'>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Género</span>
                  </label>
                  <select
                    name="req.genero"
                    value={form.requisitosParticipacion.genero}
                    onChange={handleChange}

                    className="select select-bordered w-full bg-white"
                  >
                    {form.dobles &&
                      <option value="ambos">Ambos</option>
                    }
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
            <div title="🏆 Formato del Campeonato" className='bg-white'>
              <div className="form-control bg-white">
                <label className="label">
                  <span className="label-text font-semibold">Seleccionar Formato</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="formatoCampeonatoID"
                    value={form.formatoCampeonatoID}
                    onChange={handleChange}
                    className="select select-bordered flex-1 bg-white"
                    required
                  >
                    <option value="">-- Seleccionar formato --</option>
                    {formatos.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nombre} ({f.cantidadJugadores} {form.dobles ? 'equipos' : 'jugadores'})
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
                  {precargaLoading ? 'Precargando...' : 'Precargar Formatos'}
                </button>
              </div>
              {precargaError && (
                <div className="alert alert-error mt-2">
                  <span>{precargaError}</span>
                </div>
              )}

              {formatoData && (
                <div className="alert alert-info mt-4 bg-white">
                  <div>
                    <div className="font-semibold">{formatoData.nombre}</div>
                    <div className="text-sm">{form.dobles ? 'Equipos' : 'Jugadores'}: {formatoData.cantidadJugadores}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="">
                          <span className="font-semibold">Fecha de Inicio</span>
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
                        <label className="">
                          <span className="font-semibold">Fecha de Fin</span>
                        </label>
                        <input
                          type="date"
                          name="fin"
                          value={form.fin}
                          onChange={handleChange}
                          className="input input-bordered w-full"
                          disabled
                        />
                      </div>

                    </div>
                    {formatoData.formatosEtapasIDs?.length > 0 && (
                      <div>
                        <div className="text-sm">Etapas: {formatoData.formatosEtapasIDs.join(', ')}</div>
                        <div className="mt-3">
                          <div className="font-semibold">Configuración de Etapas</div>
                          <div className="text-xs opacity-60 mb-2">Complete la cantidad de {form.dobles ? 'equipos' : 'jugadores'} al finalizar cada etapa y la duración (días). Ambos campos son obligatorios.</div>

                          <div className="space-y-2">
                            {etapasConfig.map((et, idx) => {
                              const preview = computeEtapasPreview()[idx];
                              const error = etapasErrors[idx];
                              return (
                                <div key={et.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center p-2 bg-white rounded">
                                  <div className="md:col-span-2">
                                    <div className="font-medium">{idx + 1}. {et.id}</div>
                                    <div className="text-xs opacity-60">Tipo: {et.nombre}</div>
                                  </div>
                                  {et.tipoEtapa == 'roundRobin' || et.nombre == 'roundRobin' ? (
                                    <div>
                                      <input type="number" min="1" className="input input-sm input-bordered w-full" placeholder="Cant. grupos" value={et.cantGrupos} onChange={e => handleEtapaChange(idx, 'cantGrupos', e.target.value)} required />
                                    </div>
                                  ) : <br />}
                                  <div>
                                    <input type="number" min="1" className="input input-sm input-bordered w-full" placeholder={`${form.dobles ? 'Equipos' : 'Jugadores'} al finalizar`} value={et.cantidadDeJugadoresFin} onChange={e => handleEtapaChange(idx, 'cantidadDeJugadoresFin', e.target.value)} required />
                                  </div>
                                  <div>
                                    <input type="number" min="1" className="input input-sm input-bordered w-full" placeholder="Duración (días)" value={et.duracionDias} onChange={e => handleEtapaChange(idx, 'duracionDias', e.target.value)} required />
                                  </div>
                                  <div className="text-sm opacity-70">Fecha fin: {preview?.fechaFin || '—'}</div>
                                  {error && (
                                    <div className="col-span-5 text-sm text-error mt-1">{error}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="divider"></div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">{form.dobles ? 'Equipos' : 'Jugadores'} iniciales: <strong>{form.cantidadParticipantes}</strong></div>
                            <div className="text-sm">Total días (sum): <strong>{etapasConfig.reduce((s, it) => s + (Number(it.duracionDias) || 0), 0)}</strong></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                Crear Campeonato
              </button>
            </div>
          </form>
        )}

        {/* Tab Content - Gestión de Formatos */}
        {activeTab === 'formatos' && (
          <div className="space-y-6 bg-white">
            <Card title="Gestión de Formatos" className='bg-white' style={{ color: 'var(--neutro)' }}>
              <div className="flex justify-between items-center mb-4">
                <p className="text-base-content/70" style={{ color: 'var(--neutro)' }}>Administra los formatos de campeonato disponibles</p>
                <button className="btn btn-primary" onClick={openNewFormato}>
                  + Nuevo Formato
                </button>
              </div>

              {loadingFormatos ? (
                <div className="flex justify-center py-8 bg-white">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : formatos.length === 0 ? (
                <div className="alert">
                  <span>No hay formatos disponibles. Crea uno nuevo o precarga los formatos predeterminados.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {formatos.map(f => (
                    <FormatoItem key={f.id} formato={f} onEdit={openEditFormato} dobles={form.dobles} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'etapas' && (
          <div className="space-y-6 bg-white">
            <Card title="📊 Gestión de Etapas" className="bg-white" >
              <div className="flex justify-between items-center mb-4 bg-white">
                <p style={{ color: 'var(--neutro)' }}>Administra los tipos de etapas para los formatos</p>
                <button className="btn btn-primary" onClick={openNewEtapa}>
                  + Nueva Etapa
                </button>
              </div>

              {formatosEtapas.length === 0 ? (
                <div className="alert">
                  <span>No hay etapas disponibles. Crea una nueva.</span>
                </div>
              ) : (
                <div className="space-y-3 bg-white">
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
          className="bg-white"
          style={{ backgroundColor: 'white' }}
          isOpen={!!editingFormato}
          onClose={() => setEditingFormato(null)}
          title={formatos.filter(etapa => etapa.id == (editingFormato?.id || '')).length > 0 ? '✏️ Editar Formato' : '➕ Nuevo Formato'}
        >
          <form onSubmit={saveFormato} className="space-y-4 bg-white">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nombre (clave única)</span>
              </label>
              <input
                value={editingFormato?.nombre || ''}
                onChange={e => setEditingFormato(s => ({ ...s, nombre: e.target.value, id: e.target.value }))}
                className="input input-bordered w-full"
                placeholder="Ej: Eliminación Directa 16 Jugadores"
                required
                disabled={formatos.filter(etapa => etapa.id == (editingFormato?.id || '')).length > 0}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Cantidad de {form.dobles ? 'Equipos' : 'Jugadores'}</span>
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
                className="select select-bordered mb-2 bg-white"
                onChange={e => {
                  const v = e.target.value;
                  if (!v) return;
                  setEditingFormato(s => ({
                    ...s,
                    formatosEtapasIDs: Array.from(new Set([...(s.formatosEtapasIDs || []), v]))
                  }));
                  e.target.value = '';
                }}
              >
                <option value="">-- Añadir etapa --</option>
                {formatosEtapas.map(fe => (
                  <option key={fe.id} value={fe.id}>
                    {fe.id} ({fe.tipoEtapa})
                  </option>
                ))}
              </select>

              {(editingFormato?.formatosEtapasIDs?.length || 0) > 0 && (
                <div className="space-y-2">
                  {editingFormato.formatosEtapasIDs.map((id, idx) => {
                    const meta = formatosEtapas.find(x => x.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-neutral">{idx + 1}</span>
                          <span>{meta ? `${meta.id}` : id}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs btn-error"
                          onClick={() => setEditingFormato(s => ({
                            ...s,
                            formatosEtapasIDs: (s.formatosEtapasIDs || []).filter(x => x !== id)
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
        >
          <form onSubmit={saveEtapa} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nombre (clave única)</span>
              </label>
              <input
                value={editingEtapa?.id || ''}
                onChange={e => setEditingEtapa(s => ({ ...s, id: e.target.value }))}
                className="input input-bordered w-full"
                placeholder="Ej: Fase Grupos 3 Sets"
                required
                disabled={formatosEtapas.filter(etapa => etapa.id == (editingEtapa?.id || '')).length > 0}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Tipo de Etapa</span>
              </label>
              <br />
              <select
                value={editingEtapa?.tipoEtapa || ''}
                className="select select-bordered mb-2 bg-white"
                onChange={e => setEditingEtapa(s => ({ ...s, tipoEtapa: e.target.value }))}
              >
                <option value="">-- Seleccionar tipo --</option>
                <option value="roundRobin">Fase de grupos / Round Robin</option>
                <option value="eliminacion">Eliminacion</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Cantidad de sets</span>
              </label>
              <input
                type='number'
                value={editingEtapa?.cantidadSets || ''}
                onChange={e => setEditingEtapa(s => ({ ...s, cantidadSets: e.target.value }))}
                className="input input-bordered w-full"
                placeholder="Cuántos sets debe ganar un jugador para llevarse el partido"
                rows="3"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Juegos por set</span>
              </label>
              <input
                type='number'
                value={editingEtapa?.juegosPorSet || ''}
                onChange={e => setEditingEtapa(s => ({ ...s, juegosPorSet: e.target.value }))}
                className="input input-bordered w-full"
                placeholder="Cuántos juegos se necesitan para ganar un set"
                rows="3"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button type="button" className="btn btn-ghost" onClick={() => setEditingEtapa(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                Guardar Etapa
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}