export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors">
            ArremataMarília
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
