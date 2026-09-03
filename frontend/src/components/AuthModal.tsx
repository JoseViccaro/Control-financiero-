import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, LogOut, ShieldCheck, Mail, Lock, Loader2, Cloud } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onAuthSuccess: (email: string) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onAuthSuccess,
  onSignOut,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          setSuccessMsg('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
          setIsRegister(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user?.email) {
          onAuthSuccess(data.user.email);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Cloud className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {userEmail ? 'Tu Cuenta Sincronizada' : isRegister ? 'Crear Cuenta Privada' : 'Iniciar Sesión'}
          </h2>
          <p className="text-xs text-slate-400">
            {userEmail
              ? 'Tus finanzas se sincronizan de forma segura en todos tus dispositivos.'
              : 'Protege tus finanzas con cifrado en la nube y accede desde tu móvil y PC.'}
          </p>
        </div>

        {userEmail ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center space-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Sesión Iniciada
              </span>
              <p className="text-sm font-bold text-slate-900">{userEmail}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión en este Dispositivo
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-700 font-medium">
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-400" /> Crear Mi Cuenta Segura
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-emerald-400" /> Iniciar Sesión
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                {isRegister
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Crear una gratis'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
