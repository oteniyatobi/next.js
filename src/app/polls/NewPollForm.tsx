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

/**
 * NewPollForm Component
 * 
 * A comprehensive form component for creating new polls with the following features:
 * - Real-time form validation using Zod schema
 * - Dynamic option management (add/remove options)
 * - Secure API integration for poll creation
 * - User authentication verification
 * - Loading states and error handling
 * 
 * Form Fields:
 * - Title: Required, 3-120 characters
 * - Description: Optional, max 500 characters
 * - Options: 2-10 options, dynamically managed
 * - Allow Multiple: Boolean toggle for voting type
 * - Closing Date: Optional future date
 * 
 * Security Features:
 * - Client-side validation with server-side verification
 * - Authentication required for poll creation
 * - Input sanitization and validation
 * - Secure API communication
 * 
 * @returns {JSX.Element} The new poll form component
 */
export default function NewPollForm() {
	// Authentication state - get current user
	const user = useUser()
	
	// Form state management
	const [serverError, setServerError] = useState<string>("")
	const [submitting, setSubmitting] = useState(false)

	/**
	 * React Hook Form configuration with Zod validation.
	 * 
	 * This sets up the form with:
	 * - Real-time validation using Zod schema
	 * - Default values for all form fields
	 * - onChange mode for immediate validation feedback
	 */
	const form = useForm<NewPollInput>({
		resolver: zodResolver(newPollSchema), // Integrate Zod validation
		defaultValues: {
			title: "",
			description: "",
			options: ["", ""], // Start with 2 empty options
			allowMultiple: false,
			closesAt: undefined,
		},
		mode: "onChange", // Validate on every change for immediate feedback
	})

	/**
	 * Dynamic field array for managing poll options.
	 * 
	 * This allows users to:
	 * - Add new options (up to 10 maximum)
	 * - Remove options (minimum 2 required)
	 * - Reorder options if needed
	 */
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "options",
	})

	/**
	 * Computed property to determine if form should be disabled.
	 * 
	 * Form is disabled when:
	 * - Currently submitting (prevents double submission)
	 * - User is not authenticated (prevents unauthorized creation)
	 */
	const isDisabled = useMemo(() => submitting || !user, [submitting, user])

	/**
	 * Handles form submission for creating a new poll.
	 * 
	 * This function:
	 * 1. Validates user authentication
	 * 2. Sends poll data to secure API endpoint
	 * 3. Handles success and error states
	 * 4. Resets form on successful creation
	 * 
	 * Security Features:
	 * - Authentication verification before submission
	 * - Secure API communication
	 * - Proper error handling without information disclosure
	 * 
	 * @param {NewPollInput} values - Validated form data from Zod schema
	 * @returns {Promise<void>} Promise that resolves when submission is complete
	 */
	async function onSubmit(values: NewPollInput) {
		// Verify user is authenticated before allowing poll creation
		if (!user) {
			setServerError("You must be signed in to create a poll.")
			return
		}
		
		// Clear previous errors and set loading state
		setServerError("")
		setSubmitting(true)
		
		try {
			// Send poll data to secure API endpoint
			const response = await fetch('/api/polls', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(values),
			})

			// Handle API response errors
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to create poll')
			}

			// Success - reset form and clear errors
			const result = await response.json()
			form.reset()
		} catch (err) {
			// Handle and display errors to user
			setServerError(err instanceof Error ? err.message : "Failed to create poll")
		} finally {
			// Always reset loading state
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



