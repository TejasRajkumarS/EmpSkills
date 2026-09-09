import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'employee' | 'hr' | null;

// The employee portal represents this single signed-in employee.
export const CURRENT_EMPLOYEE_ID = 'E001';

interface AuthContextType {
  role: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    const stored = localStorage.getItem('empskil_role');
    return (stored as UserRole) || null;
  });

  const login = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('empskil_role', newRole || '');
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem('empskil_role');
  };

  return (
    <AuthContext.Provider value={{
      role,
      login,
      logout,
      isAuthenticated: !!role,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}