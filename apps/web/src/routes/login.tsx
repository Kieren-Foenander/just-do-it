import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import SignInForm from '@/components/sign-in-form'
import SignUpForm from '@/components/sign-up-form'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(true)

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Just Do It
          </h1>
          <p className="mt-2 text-slate-400">
            {showSignIn ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
    </div>
  )
}
