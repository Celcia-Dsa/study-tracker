export default function ProgressSection({
    completionRate,
    masteredTopics,
    reviewedToday,
    inProgressTopics,
}) {
    return (
        <section className="mb-12 rounded-2xl border border-[#eeece8] bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold">Your learning progress</h2>
                    <p className="mt-2 text-sm text-[#9792a0]">
                        Every review is a step forward.
                    </p>
                </div>
                <span className="text-sm font-semibold text-[#7569b8]">
                    {completionRate}%
                </span>
            </div>

            <div
                className="h-3 overflow-hidden rounded-full bg-[#f0eef5]"
                role="progressbar"
                aria-label="Mastered topics"
                aria-valuenow={completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full rounded-full bg-[#9d91d3] transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                />
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-[#9691a0]">
                <span>{masteredTopics} mastered</span>
                <span>{reviewedToday} reviewed today</span>
                <span>{inProgressTopics} in progress</span>
            </div>
        </section>
    );
}
