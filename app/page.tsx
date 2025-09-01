'use client';

import { useAuth } from '../context/AuthContext';
import AuthContainer from '../components/AuthContainer';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <AuthContainer />}
    </>
  );
}
