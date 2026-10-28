import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
//import { RegisterForm } from './components/RegisterForm';
import { Navbar } from "./components/Navbar";
import { AuthPage } from "./pages/AuthPage";
import { CompletarPerfil } from './pages/CompletarPerfil';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { RecomendadorNegocios } from './components/recomendaciones/RecomendadorNegocios';
import { OfertasPage } from './pages/OfertasPage';

//NOTA: LO DE SOLICITUDES ES LO MISMO QUE LO DE NECESIDADES, ES DECIR, QUE AQUI YO LO MANEJO COMO UNA SOLICITUD PERO TIENE EL 
//MISMO CUERPO QUE UNA NECESIDAD

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
          <Navbar />
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <CompletarPerfil />
                </ProtectedRoute>
              }
            /> 
             <Route
              path="/solicitudes"
              element={ 
                <ProtectedRoute>
                  <SolicitudesPage />
                </ProtectedRoute> 
              }
              />
              <Route
              path="/recomendaciones"
              element={
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
                  <RecomendadorNegocios />
                </div>
              }
            />

            <Route path="/ofertas" 
              element={<OfertasPage />} 
            />
          </Routes>

          
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}