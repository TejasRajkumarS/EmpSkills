import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">EmpSkil</h1>
          <p className="text-gray-600 mt-2">Employee Skill Intelligence</p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">Select Your Role</h2>

            <div className="space-y-4">
              <button
                onClick={() => login('employee')}
                className="w-full btn-secondary text-left p-6 hover:bg-primary-50 hover:border-primary-200 border-2 border-gray-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Employee</h3>
                    <p className="text-sm text-gray-500">Skill Audits, Role Readiness, Training Pathways</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => login('hr')}
                className="w-full btn-secondary text-left p-6 hover:bg-primary-50 hover:border-primary-200 border-2 border-gray-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">HR & L&D</h3>
                    <p className="text-sm text-gray-500">Workforce Staffing, HR Enterprise Analytics Portal</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Demo mode — no credentials required
        </p>
      </div>
    </div>
  );
}