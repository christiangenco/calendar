"use client"

import type React from "react"

import { useState } from "react"

interface YearNoteProps {
  year: number
  initialNote?: string
  onChange: (year: number, note: string) => void
}

export function YearNote({ year, initialNote = "", onChange }: YearNoteProps) {
  const [note, setNote] = useState(initialNote)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value)
  }

  const handleBlur = () => {
    onChange(year, note)
  }

  return (
    <input
      type="text"
      value={note}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="..."
      className="bg-transparent border-none outline-none focus:border-b focus:border-gray-300 dark:focus:border-gray-600 w-48 text-gray-500 dark:text-gray-400 italic text-xs"
    />
  )
}
