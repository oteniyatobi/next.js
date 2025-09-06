import NewPollForm from '@/app/polls/NewPollForm'

export default function PollsPage() {
	return (
		<div className="min-h-screen p-6 flex items-start justify-center bg-gray-50">
			<div className="w-full max-w-3xl">
				<NewPollForm />
			</div>
		</div>
	)
}



