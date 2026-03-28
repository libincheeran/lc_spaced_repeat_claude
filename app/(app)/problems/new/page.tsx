import { AddProblemForm } from '@/components/add-problem-form'

export default function NewProblemPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Problem</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a LeetCode problem to your spaced repetition schedule.
        </p>
      </div>
      <AddProblemForm />
    </div>
  )
}
