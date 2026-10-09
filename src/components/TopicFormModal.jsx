import { CATEGORIES } from "../lib/study";

export default function TopicFormModal({
    form,
    setForm,
    editing,
    onClose,
    onSubmit,
}) {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#262234]/40 p-4 backdrop-blur-sm"
        >
            <form
                onSubmit={onSubmit}
                onClick={(event) => event.stopPropagation()}
                className="my-auto w-full max-w-lg rounded-2xl border border-[#eeeaf2] bg-white p-6 shadow-2xl md:p-8"
            >
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <p className="mb-2 text-[10px] font-bold tracking-[2px] text-[#a19dad]">
                            YOUR LEARNING LIBRARY
                        </p>
                        <h2 className="text-xl font-bold">
                            {editing ? "Edit topic" : "Add a new topic"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close form"
                        className="text-2xl text-[#888494]"
                    >
                        ×
                    </button>
                </div>

                <label className="mb-5 block text-sm font-medium">
                    Topic name
                    <input
                        required
                        autoFocus
                        value={form.title}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="e.g. Python functions"
                        className="mt-2 w-full rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
                    />
                </label>

                <label className="mb-5 block text-sm font-medium">
                    Learning area
                    <select
                        value={form.category}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, category: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-[#e8e5eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
                    >
                        {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="mb-5 block text-sm font-medium">
                    Learning notes
                    <textarea
                        rows={3}
                        value={form.notes}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, notes: event.target.value }))
                        }
                        placeholder="Your explanation, examples, or key takeaways..."
                        className="mt-2 w-full resize-y rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
                    />
                </label>

                <label className="block text-sm font-medium">
                    What do I need to revisit?
                    <textarea
                        rows={3}
                        value={form.revisionNotes}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                revisionNotes: event.target.value,
                            }))
                        }
                        placeholder="What confused me? What should I practise again?"
                        className="mt-2 w-full resize-y rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
                    />
                </label>

                <div className="mt-7 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-xl bg-[#7569b8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6256a5]"
                    >
                        {editing ? "Save changes" : "Add topic"}
                    </button>
                </div>
            </form>
        </div>
    );
}
