'use client'

import { logoutAction } from '@/app/(auth)/actions'

export default function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded"
    >
      Выйти
    </button>
  )
}
