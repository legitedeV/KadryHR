import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Alert from '../components/Alert';

const Profile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.put('/auth/profile', profileForm);
      
      // Update user in context and localStorage
      login({ token: localStorage.getItem('kadryhr_token'), user: data.user });
      
      setSuccess('Profil zaktualizowany pomyślnie');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się zaktualizować profilu');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Nowe hasła nie są identyczne');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Nowe hasło musi mieć minimum 6 znaków');
      setLoading(false);
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setSuccess('Hasło zmienione pomyślnie');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się zmienić hasła');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Plik jest za duży. Maksymalny rozmiar to 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Nieprawidłowy typ pliku. Dozwolone: JPEG, PNG, GIF, WEBP');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const { data } = await api.post('/avatar/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user in context
      const updatedUser = { ...user, avatarUrl: data.avatarUrl };
      login({ token: localStorage.getItem('kadryhr_token'), user: updatedUser });

      setSuccess('Avatar przesłany pomyślnie');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się przesłać avatara');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć avatar?')) return;

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete('/avatar');

      // Update user in context
      const updatedUser = { ...user, avatarUrl: null };
      login({ token: localStorage.getItem('kadryhr_token'), user: updatedUser });

      setSuccess('Avatar usunięty pomyślnie');
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się usunąć avatara');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatarUrl) {
      // Ensure the URL is absolute
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return user.avatarUrl.startsWith('http') ? user.avatarUrl : `${baseUrl}${user.avatarUrl}`;
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg transition-all duration-300"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-primary-rgb), 0.3)`
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profil użytkownika</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Zarządzaj swoimi danymi osobowymi</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Avatar Upload */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <svg 
            className="w-5 h-5 transition-colors duration-300" 
            style={{ color: 'var(--theme-primary)' }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Zdjęcie profilowe
        </h2>

        <div className="flex items-center gap-6">
          <div className="relative">
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`,
                }}
              >
                {getInitials(user?.name)}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Wybierz zdjęcie
                </label>
              </div>

              {avatarFile && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingAvatar ? 'Przesyłanie...' : 'Prześlij'}
                  </button>
                  <button
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              )}

              {user?.avatarUrl && !avatarFile && (
                <button
                  onClick={handleAvatarDelete}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? 'Usuwanie...' : 'Usuń zdjęcie'}
                </button>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dozwolone formaty: JPEG, PNG, GIF, WEBP. Maksymalny rozmiar: 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor Info */}
      {user?.supervisor && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <svg 
              className="w-6 h-6 transition-colors duration-300" 
              style={{ color: 'var(--theme-primary)' }}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Przełożony</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user.supervisor.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{user.supervisor.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <svg 
            className="w-5 h-5 transition-colors duration-300" 
            style={{ color: 'var(--theme-primary)' }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Dane osobowe
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Imię i nazwisko
            </label>
            <input
              type="text"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              className="input-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              className="input-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Numer telefonu
            </label>
            <input
              type="tel"
              name="phone"
              value={profileForm.phone}
              onChange={handleProfileChange}
              className="input-primary"
              placeholder="+48 123 456 789"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zapisywanie...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Zapisz zmiany
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <svg 
            className="w-5 h-5 transition-colors duration-300" 
            style={{ color: 'var(--theme-primary)' }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Zmiana hasła
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Obecne hasło
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="input-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nowe hasło
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="input-primary"
              minLength={6}
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 6 znaków</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Potwierdź nowe hasło
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="input-primary"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zmienianie...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Zmień hasło
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
