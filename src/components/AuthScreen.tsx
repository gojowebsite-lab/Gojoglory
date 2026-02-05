'use client';

import { useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { MessageCircle, Send, ShieldCheck, Mail, Lock, User as UserIcon, LogIn, UserPlus, Chrome } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export function AuthScreen() {
  const { settings } = useSettings();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        // Check if profile exists
        const profileRef = ref(database, `profiles/${user.uid}`);
        const snapshot = await get(profileRef);
        
        if (!snapshot.exists()) {
          // Create new profile
          await set(profileRef, {
            username: user.displayName?.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0] || 'user',
            role: 'user',
            basic_credits: 0,
            premium_credits: 0,
            max_groups: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscore');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Update display name
        await updateProfile(user, { displayName: username.toLowerCase() });

        // Create profile in Realtime Database
        await set(ref(database, `profiles/${user.uid}`), {
          username: username.toLowerCase(),
          role: 'user',
          basic_credits: 0,
          premium_credits: 0,
          max_groups: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        setMessage('Account created successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="flex-grow flex items-center justify-center p-6 md:p-8 relative z-10">
      <div className="w-full max-w-md">
        <div className="ng-card p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-red-500/30 to-pink-500/20 rounded-full scale-150"></div>
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="relative w-16 h-16 mx-auto rounded-2xl bg-black/40 p-2 border border-white/10 shadow-lg shadow-red-500/25 transition-transform hover:scale-110 duration-500 object-contain" />
                ) : (
                  <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#dd0031] to-[#c3002f] flex items-center justify-center shadow-lg shadow-red-500/25 transition-transform hover:scale-110 duration-500">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <h2 className="heading text-2xl md:text-3xl font-bold mt-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[var(--ng-text-muted)] text-xs mt-2">
                {tab === 'login' ? 'Sign in to ' : 'Join '}
                <span className="text-[#dd0031] font-semibold">{settings.name || 'FFGlory'}</span> panel
              </p>
            </div>

            <div className="flex mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === 'login' ? 'bg-gradient-to-r from-[#dd0031] to-[#c3002f] text-white shadow-sm' : 'text-[var(--ng-text-muted)] hover:text-white hover:bg-white/5'
                }`}
              >
                <LogIn size={14} />
                Sign In
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === 'signup' ? 'bg-gradient-to-r from-[#dd0031] to-[#c3002f] text-white shadow-sm' : 'text-[var(--ng-text-muted)] hover:text-white hover:bg-white/5'
                }`}
              >
                <UserPlus size={14} />
                Sign Up
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Chrome size={18} className="text-red-400" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] text-[var(--ng-text-subtle)] uppercase tracking-widest font-bold">OR</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="ng-form-group">
                    <label className="block text-[var(--ng-text-muted)] text-xs font-medium mb-1.5">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ng-text-subtle)]">
                        <Mail size={16} />
                      </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="ng-input !pl-11 py-3 text-sm"
                          placeholder="Enter your email"
                          required
                        />
                    </div>
                  </div>
                <div className="ng-form-group">
                  <label className="block text-[var(--ng-text-muted)] text-xs font-medium mb-1.5">Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ng-text-subtle)]">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ng-input !pl-11 py-3 text-sm"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#dd0031] to-[#c3002f] hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <LogIn size={18} />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 mb-0.5">
                        <ShieldCheck size={16} />
                        <span className="font-bold text-xs">Open Registration</span>
                      </div>
                      <p className="text-[10px] text-emerald-300/70">No invitation code required!</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-300">Email Address</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="ng-input !pl-11 py-3 text-sm"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-300">Username</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <UserIcon size={16} />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="ng-input !pl-11 py-3 text-sm lowercase"
                        placeholder="Choose username"
                        required
                        minLength={3}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ng-input !pl-11 py-3 text-sm"
                        placeholder="Create password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-300">Confirm Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <ShieldCheck size={16} />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="ng-input !pl-11 py-3 text-sm"
                        placeholder="Confirm password"
                        required
                      />
                    </div>
                  </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#dd0031] to-[#c3002f] hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <UserPlus size={18} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-4 text-center bg-red-500/10 py-3 rounded-xl border border-red-500/30 animate-shake">
              {error}
            </p>
          )}
          {message && (
            <p className="text-emerald-400 text-sm mt-4 text-center bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/30">
              {message}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-[var(--ng-text-muted)] mb-4">Need help? Contact Admin</p>
            <div className="grid grid-cols-2 gap-3">
              {settings.whatsapp_enabled && settings.whatsapp_link && (
                <a href={settings.whatsapp_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 no-underline hover:scale-[1.02] active:scale-[0.98]">
                  <MessageCircle size={20} />
                  <span className="font-bold text-sm">WhatsApp</span>
                </a>
              )}
              {settings.telegram_enabled && settings.telegram_link && (
                <a href={settings.telegram_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all border border-[#0088cc]/20 no-underline hover:scale-[1.02] active:scale-[0.98]">
                  <Send size={20} />
                  <span className="font-bold text-sm">Telegram</span>
                </a>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

