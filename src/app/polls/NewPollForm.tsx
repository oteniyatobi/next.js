"use client"

import { useMemo, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { newPollSchema, type NewPollInput } from "@/app/polls/schemas"
// Use secure API routes instead of direct database access
import { useUser } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function NewPollForm() {
	const user = useUser()
	const [serverError, setServerError] = useState<string>("")
	const [submitting, setSubmitting] = useState(false)

	const form = useForm<NewPollInput>({
		resolver: zodResolver(newPollSchema),
		defaultValues: {
			title: "",
			description: "",
			options: ["", ""],
			allowMultiple: false,
			closesAt: undefined,
		},
		mode: "onChange",
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "options",
	})

	const isDisabled = useMemo(() => submitting || !user, [submitting, user])

	async function onSubmit(values: NewPollInput) {
		if (!user) {
			setServerError("You must be signed in to create a poll.")
			return
		}
		setServerError("")
		setSubmitting(true)
		try {
			const response = await fetch('/api/polls', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(values),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to create poll')
			}

			const result = await response.json()
			form.reset()
		} catch (err) {
			setServerError(err instanceof Error ? err.message : "Failed to create poll")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle>New Poll</CardTitle>
				<CardDescription>Create a poll with at least two options.</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="e.g. What should we have for lunch?" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description (optional)</FormLabel>
									<FormControl>
										<Input placeholder="Add more details..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-3">
							<FormLabel>Options</FormLabel>
							<div className="space-y-2">
								{fields.map((field, index) => (
									<FormField
										key={field.id}
										control={form.control}
										name={`options.${index}` as const}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Input placeholder={`Option ${index + 1}`} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								))}
							</div>
							<div className="flex gap-2">
								<Button type="button" variant="secondary" onClick={() => append("")}>Add option</Button>
								<Button type="button" variant="outline" onClick={() => fields.length > 2 && remove(fields.length - 1)} disabled={fields.length <= 2}>Remove last</Button>
							</div>
						</div>

						{serverError && (
							<p className="text-sm text-red-600">{serverError}</p>
						)}

						<div className="flex justify-end">
							<Button type="submit" disabled={isDisabled}>
								{submitting ? "Creating..." : "Create Poll"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}



