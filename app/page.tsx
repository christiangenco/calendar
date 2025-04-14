import { Calendar } from "@/components/calendar"

export default function Home() {
  // Initial data for the calendar
  const initialStartDate = new Date("1991-01-01")
  const initialEndDate = new Date("2045-12-31")

  return (
    <main className="container mx-auto p-4 dark:bg-gray-900">
      <Calendar initialStartDate={initialStartDate} initialEndDate={initialEndDate} />
    </main>
  )
}
