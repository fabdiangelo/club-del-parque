import React from "react";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { useState } from "react";

import  '../styles/SistemaRegistro.css';
import { useAuth } from "../contexts/AuthProvider";
// Recordar cambiar esto cuando se haga deploy

const SistemaReporte = () => {
    const [formData, setFormData] = useState({
        motivo: '',
        descripcion: '',
    });

    const { user } = useAuth();
    const mailUsuario = user ? user.email : 'anónimo';

    const [mensaje, setMensaje] = useState(null);
    const [tipoMensaje, setTipoMensaje] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleValuesChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const enviarReporte = async(e) => {
        e.preventDefault();
        setIsLoading(true);
        setMensaje(null);

        const formInfo = {
            tipo: 'reporte_bug',
            motivo: formData.motivo,
            descripcion: formData.descripcion,
            estado: 'pendiente',
            mailUsuario: mailUsuario,
            leido: false
        }

        console.log('Enviando:', formInfo);

        try {
            const response = await fetch(`api/reportes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formInfo),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al enviar el reporte');
            }

            const data = await response.json();
            console.log('Success:', data);

            setMensaje('Reporte enviado con éxito');
            setTipoMensaje('success');
            
            setFormData({ motivo: '', descripcion: '' });

        } catch (error) {
            console.error('Error:', error);
            
            setMensaje(error.message);
            setTipoMensaje('error');
        } finally {
            setIsLoading(false);
        }


        setTimeout(() => {
            setMensaje(null);
        }, 3000);
    }

    return (
        <>
            <NavbarBlanco color="white" />

            <div className="flex flex-col justify-center items-center min-h-screen gap-4 px-4">
                <h1 className="text-5xl font-bold text-center" style={{ 'color': 'var(--neutro)' }}>
                    SISTEMA DE REPORTES
                </h1>
                <p style={{ 'color': 'gray', 'marginTop': '20px' }} className="text-center">
                    Si notaste algún problema en la web, por favor haznoslo saber. Lo solucionaremos a la brevedad.
                </p>

                {mensaje && (
                    <div role="alert" className={`alert ${tipoMensaje === 'success' ? 'alert-success' : 'alert-error'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d={tipoMensaje === 'success' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                        <span>{mensaje}</span>
                    </div>
                )}

                <form className="w-full max-w-lg flex flex-col gap-4 mt-6" onSubmit={enviarReporte}>
                    <input 
                        type="text" 
                        placeholder="Motivo" 
                        className="input w-full bg-white text-black disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" 
                        value={formData.motivo} 
                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                        disabled={isLoading}
                    />
                    <textarea 
                        name="descripcion" 
                        type="text" 
                        placeholder="Descripción" 
                        value={formData.descripcion} 
                        className="input w-full h-32 resize-none bg-white text-black disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" 
                        onChange={(e) => handleValuesChange(e)}
                        disabled={isLoading}
                    />


                    <button 
                        type="submit" 
                        className="btn btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default SistemaReporte;