import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const employeeNavigation = [
  { name: 'Skill Audits', href: '/skill-audits' },
  { name: 'Role Readiness', href: '/role-readiness' },
  { name: 'Training Pathways', href: '/training-pathways' },
];

const hrNavigation = [
  { name: 'Workforce Staffing', href: '/workforce-staffing' },
  { name: 'HR Analytics Portal', href: '/hr-analytics' },
  { name: 'Reports', href: '/reports' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { role, logout } = useAuth();

  const navigation = role === 'employee' ? employeeNavigation : role === 'hr' ? hrNavigation : [];
  const homePath = role === 'hr' ? '/workforce-staffing' : '/skill-audits';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to={homePath} className="text-xl font-bold text-primary-600">
                EmpSkil
              </Link>
              <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {role === 'employee' ? 'Employee View' : role === 'hr' ? 'HR & L&D View' : ''}
              </span>
              <button
                onClick={logout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}