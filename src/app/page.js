"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import TopicCard from "../components/TopicCard";
import TopicFormModal from "../components/TopicFormModal";
import ProgressSection from "../components/ProgressSection";
import {
  CATEGORIES,
  STORAGE_KEY,
  createEmptyForm,
  getToday,
} from "../lib/study";

const CONFIDENCE = [
  {
    value: "struggling",
    label: "Struggling",
    tone: "bg-[#fff0eb] text-[#b86f5a]",
  },
  {
    value: "learning",
    label: "Getting there",
    tone: "bg-[#fff7df] text-[#a38336]",
  },
  {
    value: "confident",
    label: "Confident",
    tone: "bg-[#e9f5ed] text-[#548568]",
  },
];

function normalizeTopic(topic) {
  return {
    ...topic,
    resources: Array.isArray(topic.resources) ? topic.resources : [],
    snippets: Array.isArray(topic.snippets) ? topic.snippets : [],
    flashcards: Array.isArray(topic.flashcards) ? topic.flashcards : [],
    confidence: topic.confidence || "learning",
    history: Array.isArray(topic.history) ? topic.history : [],
  };
}

export default function Home() {
  const [topics, setTopics] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("Overview");
  const [form, setForm] = useState(createEmptyForm);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTopics(parsed.map(normalizeTopic));
      }
    } catch (error) {
      console.error("Could not load saved topics.", error);
      setNotice(
        "Saved topics could not be read. Try importing a backup if you have one.",
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
      } catch (error) {
        console.error("Could not save topics.", error);
        setNotice(
          "Browser storage is full. Export a backup and consider removing large snippets.",
        );
      }
    }
  }, [topics, loaded]);

  const today = getToday();
  const dueTopics = useMemo(
    () =>
      topics.filter((topic) => topic.nextReview && topic.nextReview <= today),
    [topics, today],
  );
  const reviewedToday = topics.filter(
    (topic) => topic.lastReviewed === today,
  ).length;
  const masteredTopics = topics.filter((topic) => topic.mastered).length;
  const inProgressTopics = topics.length - masteredTopics;
  const completionRate = topics.length
    ? Math.round((masteredTopics / topics.length) * 100)
    : 0;
  const selectedTopic =
    topics.find((topic) => topic.id === selectedTopicId) || null;
  const studyQueue = useMemo(
    () =>
      [...topics]
        .sort((a, b) => {
          const aDue = a.nextReview && a.nextReview <= today ? 0 : 1;
          const bDue = b.nextReview && b.nextReview <= today ? 0 : 1;
          if (aDue !== bDue) return aDue - bDue;
          const rank = { struggling: 0, learning: 1, confident: 2 };
          return (
            (rank[a.confidence || "learning"] ?? 1) -
            (rank[b.confidence || "learning"] ?? 1)
          );
        })
        .slice(0, 5),
    [topics, today],
  );

  const visibleTopics = topics.filter((topic) => {
    const query = search.toLowerCase();
    const searchable = [
      topic.title,
      topic.notes,
      topic.revisionNotes,
      ...(topic.resources || []).map((r) => `${r.title} ${r.url}`),
      ...(topic.snippets || []).map((s) => `${s.title} ${s.code}`),
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchable.includes(query);
    const matchesCategory = filter === "All" || topic.category === filter;
    const matchesView =
      view !== "Due Reviews" || (topic.nextReview && topic.nextReview <= today);
    return matchesSearch && matchesCategory && matchesView;
  });

  function openView(nextView) {
    setView(nextView);
    setSearch("");
    setFilter("All");
    setSelectedTopicId(null);
  }
  function openAddTopic() {
    setEditingId(null);
    setForm(createEmptyForm());
    setShowForm(true);
  }
  function openEditTopic(topic) {
    setEditingId(topic.id);
    setForm({
      title: topic.title || "",
      category: topic.category || "Python",
      notes: topic.notes || "",
      revisionNotes: topic.revisionNotes || "",
    });
    setShowForm(true);
  }
  function openDetails(topic) {
    setSelectedTopicId(topic.id);
    setView("Topic Detail");
  }
  function saveTopic(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    if (editingId !== null) {
      setTopics((current) =>
        current.map((topic) =>
          topic.id === editingId
            ? {
                ...normalizeTopic(topic),
                title,
                category: form.category,
                notes: form.notes.trim(),
                revisionNotes: form.revisionNotes.trim(),
              }
            : topic,
        ),
      );
    } else {
      const newTopic = {
        id: crypto.randomUUID(),
        title,
        category: form.category,
        notes: form.notes.trim(),
        revisionNotes: form.revisionNotes.trim(),
        nextReview: getToday(),
        reviewIndex: 0,
        lastReviewed: null,
        mastered: false,
        createdAt: new Date().toISOString(),
        confidence: "learning",
        resources: [],
        snippets: [],
        flashcards: [],
        history: [],
      };
      setTopics((current) => [newTopic, ...current]);
      setSelectedTopicId(newTopic.id);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyForm());
    setView("All Topics");
    setFilter("All");
    setSearch("");
  }
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyForm());
  }
  function deleteTopic(id) {
    if (
      window.confirm(
        "Delete this topic and its resources, snippets, and flashcards? This cannot be undone unless you have a backup.",
      )
    ) {
      setTopics((current) => current.filter((topic) => topic.id !== id));
      if (selectedTopicId === id) {
        setSelectedTopicId(null);
        setView("All Topics");
      }
    }
  }
  function reviewTopic(id, result) {
    const intervals = [1, 3, 7, 14, 30];
    setTopics((current) =>
      current.map((raw) => {
        const topic = normalizeTopic(raw);
        if (topic.id !== id) return topic;
        const nextDate = new Date();
        let nextIndex = topic.reviewIndex ?? 0;
        let mastered = topic.mastered ?? false;
        if (result === "remembered") {
          if (nextIndex >= intervals.length) {
            mastered = true;
            nextDate.setDate(nextDate.getDate() + 30);
          } else {
            nextDate.setDate(nextDate.getDate() + intervals[nextIndex]);
            nextIndex += 1;
            mastered = false;
          }
        } else {
          nextIndex = 0;
          mastered = false;
          nextDate.setDate(nextDate.getDate() + 1);
        }
        return {
          ...topic,
          reviewIndex: nextIndex,
          nextReview: formatDateForStorage(nextDate),
          lastReviewed: getToday(),
          lastResult: result,
          mastered,
          history: [
            {
              date: getToday(),
              result,
              confidence: topic.confidence || "learning",
            },
            ...(topic.history || []),
          ].slice(0, 100),
        };
      }),
    );
  }
  function updateTopic(id, updates) {
    setTopics((current) =>
      current.map((topic) =>
        topic.id === id ? { ...normalizeTopic(topic), ...updates } : topic,
      ),
    );
  }
  function exportBackup() {
    const backup = {
      app: "My Study Space",
      version: 2,
      exportedAt: new Date().toISOString(),
      topics,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `my-study-space-backup-${getToday()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Backup downloaded. Keep it somewhere safe.");
  }
  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = Array.isArray(parsed) ? parsed : parsed.topics;
        if (
          !Array.isArray(imported) ||
          imported.some((topic) => !topic || typeof topic.title !== "string")
        )
          throw new Error("Invalid backup format");
        if (
          !window.confirm(
            `Replace your current ${topics.length} topics with ${imported.length} topics from this backup? Export your current data first if you want to keep it.`,
          )
        )
          return;
        setTopics(
          imported.map((topic) =>
            normalizeTopic({ ...topic, id: topic.id || crypto.randomUUID() }),
          ),
        );
        setSelectedTopicId(null);
        setView("Overview");
        setNotice(`Imported ${imported.length} topics successfully.`);
      } catch (error) {
        setNotice(
          "That file doesn't look like a valid My Study Space JSON backup.",
        );
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <main className="min-h-screen bg-[#faf9f7] text-[#29283a] md:flex">
      <Sidebar view={view} onNavigate={openView} dueCount={dueTopics.length} />
      <section className="min-w-0 flex-1">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-[#eeece8] bg-white/70 px-5 py-4 md:px-10">
          <p className="text-sm text-[#6f6b7c]">
            My workspace{" "}
            <span className="text-[#aaa6b1]">
              /{" "}
              {view === "Topic Detail" && selectedTopic
                ? selectedTopic.title
                : view}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportBackup}
              className="rounded-xl border border-[#e8e5eb] px-3 py-2.5 text-xs font-medium hover:bg-[#f7f5fb]"
            >
              ↓ Export backup
            </button>
            <label className="cursor-pointer rounded-xl border border-[#e8e5eb] px-3 py-2.5 text-xs font-medium hover:bg-[#f7f5fb]">
              ↑ Import backup
              <input
                type="file"
                accept="application/json,.json"
                onChange={importBackup}
                className="hidden"
              />
            </label>
            <button
              onClick={openAddTopic}
              className="rounded-xl bg-[#7569b8] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6256a5]"
            >
              + Add a topic
            </button>
          </div>
        </header>
        {notice && (
          <div className="mx-5 mt-4 flex items-start justify-between gap-4 rounded-xl border border-[#e8e2f7] bg-[#f4f1fc] px-4 py-3 text-sm text-[#6256a5] md:mx-10">
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss"
              className="text-lg"
            >
              ×
            </button>
          </div>
        )}
        <div className="mx-auto max-w-6xl p-5 md:p-10">
          {view === "Topic Detail" && selectedTopic ? (
            <TopicDetail
              topic={normalizeTopic(selectedTopic)}
              onBack={() => openView("All Topics")}
              onEdit={() => openEditTopic(selectedTopic)}
              onDelete={() => deleteTopic(selectedTopic.id)}
              onUpdate={(updates) => updateTopic(selectedTopic.id, updates)}
              onReview={(result) => reviewTopic(selectedTopic.id, result)}
            />
          ) : view === "Overview" ? (
            <>
              <div className="mb-9">
                <p className="mb-3 text-[10px] font-bold tracking-[2px] text-[#a19dad]">
                  {dateLabel.toUpperCase()}
                </p>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Make today count<span className="text-[#9d91d3]">.</span>
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#888494]">
                  You don&apos;t have to learn everything today. Pick one useful
                  next step.
                </p>
              </div>
              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total topics"
                  value={topics.length}
                  icon="▤"
                  color="bg-[#f0edfb] text-[#786ab9]"
                  note="Your learning library"
                />
                <StatCard
                  label="Due for revision"
                  value={dueTopics.length}
                  icon="↻"
                  color="bg-[#fff0e8] text-[#bf8668]"
                  note="Ready for a quick review"
                />
                <StatCard
                  label="Mastered topics"
                  value={masteredTopics}
                  icon="✓"
                  color="bg-[#e9f5ed] text-[#649b83]"
                  note="Completed the revision cycle"
                />
                <StatCard
                  label="Completion rate"
                  value={`${completionRate}%`}
                  icon="◔"
                  color="bg-[#eaf2fc] text-[#6689bf]"
                  note={`${inProgressTopics} topics in progress`}
                />
              </div>
              <ProgressSection
                completionRate={completionRate}
                masteredTopics={masteredTopics}
                reviewedToday={reviewedToday}
                inProgressTopics={inProgressTopics}
              />
              <section className="mb-12 mt-10">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      What should I study next?
                    </h2>
                    <p className="mt-2 text-sm text-[#9792a0]">
                      Due topics come first, then topics that need more
                      confidence. No streaks, no pressure.
                    </p>
                  </div>
                  <button
                    onClick={() => openView("All Topics")}
                    className="shrink-0 text-sm font-semibold text-[#7669b6]"
                  >
                    All topics →
                  </button>
                </div>
                {studyQueue.length === 0 ? (
                  <EmptyState
                    title="Your learning space awaits"
                    description="Add your first topic and your study queue will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {studyQueue.map((topic) => (
                      <div
                        key={topic.id}
                        className="rounded-2xl border border-[#eeece8] bg-white p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <button
                            onClick={() => openDetails(topic)}
                            className="min-w-0 text-left"
                          >
                            <span className="rounded-md bg-[#f2f0fa] px-2 py-1 text-[10px] font-semibold text-[#796cb3]">
                              {topic.category}
                            </span>
                            <h3 className="mt-3 text-sm font-semibold">
                              {topic.title}
                            </h3>
                            <p className="mt-1 text-xs text-[#8f8a99]">
                              {topic.nextReview && topic.nextReview <= today
                                ? "Due for revision"
                                : "Up next"}{" "}
                              · Confidence:{" "}
                              {CONFIDENCE.find(
                                (c) => c.value === topic.confidence,
                              )?.label || "Getting there"}
                            </p>
                          </button>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openDetails(topic)}
                              className="rounded-lg bg-[#f0eefb] px-3 py-2 text-xs font-semibold text-[#6559ad]"
                            >
                              Study topic →
                            </button>
                            {topic.nextReview && topic.nextReview <= today && (
                              <button
                                onClick={() =>
                                  reviewTopic(topic.id, "remembered")
                                }
                                className="rounded-lg border border-[#dcefe3] bg-[#f0f8f2] px-3 py-2 text-xs text-[#548568]"
                              >
                                Quick review ✓
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <div className="mb-5">
                  <h2 className="text-lg font-bold">Your learning areas</h2>
                  <p className="mt-2 text-sm text-[#9792a0]">
                    Keep your learning organised, one topic at a time.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CATEGORIES.map((category, index) => {
                    const count = topics.filter(
                      (topic) => topic.category === category,
                    ).length;
                    const colors = [
                      "bg-[#a49ad8]",
                      "bg-[#e2a68b]",
                      "bg-[#8ebca4]",
                      "bg-[#83a6d6]",
                      "bg-[#d6b477]",
                      "bg-[#d59bbd]",
                      "bg-[#aaa5af]",
                    ];
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setFilter(category);
                          setView("All Topics");
                          setSearch("");
                        }}
                        className="rounded-2xl border border-[#eeece8] bg-white p-5 text-left transition hover:-translate-y-1 hover:border-[#cfc6ee]"
                      >
                        <div
                          className={`mb-4 h-2.5 w-2.5 rounded-full ${colors[index]}`}
                        />
                        <h3 className="text-sm font-semibold">{category}</h3>
                        <p className="mt-2 text-xs text-[#9b96a3]">
                          {count} {count === 1 ? "topic" : "topics"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          ) : view === "All Topics" || view === "Due Reviews" ? (
            <>
              <div className="mb-8">
                <p className="mb-3 text-[10px] font-bold tracking-[2px] text-[#a19dad]">
                  YOUR LEARNING LIBRARY
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  {view === "Due Reviews"
                    ? "Time to revise."
                    : "All your topics."}
                </h1>
                <p className="mt-3 text-sm text-[#888494]">
                  {view === "Due Reviews"
                    ? "Review, test yourself, and adjust confidence as you go."
                    : "Open any topic to manage notes, flashcards, resources, and code snippets."}
                </p>
              </div>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search topics, notes, resources..."
                  className="min-w-0 flex-1 rounded-xl border border-[#e8e5eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
                />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="rounded-xl border border-[#e8e5eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              {visibleTopics.length === 0 ? (
                <EmptyState
                  title="Nothing here just yet"
                  description="Try another filter, or add a topic to get started."
                />
              ) : (
                <div className="space-y-3">
                  {visibleTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={normalizeTopic(topic)}
                      onReview={reviewTopic}
                      onDelete={deleteTopic}
                      onEdit={openEditTopic}
                      onOpen={openDetails}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-[#eeece8] bg-white p-8 text-sm text-[#888494]">
              Choose a topic to continue.
            </div>
          )}
        </div>
      </section>
      {showForm && (
        <TopicFormModal
          form={form}
          setForm={setForm}
          editing={editingId !== null}
          onClose={closeForm}
          onSubmit={saveTopic}
        />
      )}
    </main>
  );
}

function TopicDetail({ topic, onBack, onEdit, onDelete, onUpdate, onReview }) {
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetCode, setSnippetCode] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [activeTab, setActiveTab] = useState("Notes");
  const cards = topic.flashcards || [];
  const activeCard = cards.length ? cards[practiceIndex % cards.length] : null;
  function addResource(event) {
    event.preventDefault();
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;
    let url = resourceUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    onUpdate({
      resources: [
        ...(topic.resources || []),
        { id: crypto.randomUUID(), title: resourceTitle.trim(), url },
      ],
    });
    setResourceTitle("");
    setResourceUrl("");
  }
  function addSnippet(event) {
    event.preventDefault();
    if (!snippetTitle.trim() || !snippetCode.trim()) return;
    onUpdate({
      snippets: [
        ...(topic.snippets || []),
        {
          id: crypto.randomUUID(),
          title: snippetTitle.trim(),
          code: snippetCode,
        },
      ],
    });
    setSnippetTitle("");
    setSnippetCode("");
  }
  function addFlashcard(event) {
    event.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    onUpdate({
      flashcards: [
        ...cards,
        {
          id: crypto.randomUUID(),
          question: question.trim(),
          answer: answer.trim(),
          correct: 0,
          needsPractice: 0,
        },
      ],
    });
    setQuestion("");
    setAnswer("");
  }
  function gradeCard(gotIt) {
    if (!activeCard) return;
    onUpdate({
      flashcards: cards.map((card) =>
        card.id === activeCard.id
          ? {
              ...card,
              correct: (card.correct || 0) + (gotIt ? 1 : 0),
              needsPractice: (card.needsPractice || 0) + (gotIt ? 0 : 1),
              lastPracticed: getToday(),
            }
          : card,
      ),
    });
    setPracticeIndex((index) => (index + 1) % cards.length);
    setRevealed(false);
  }
  const tabs = ["Notes", "Flashcards", "Resources", "Code snippets", "History"];
  return (
    <>
      <button
        onClick={onBack}
        className="mb-6 text-sm font-semibold text-[#7669b6]"
      >
        ← Back to topics
      </button>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-[10px] font-bold tracking-[2px] text-[#a19dad]">
            {topic.category.toUpperCase()} · TOPIC DETAIL
          </p>
          <h1 className="break-words text-3xl font-bold tracking-tight">
            {topic.title}
          </h1>
          <p className="mt-3 text-sm text-[#888494]">
            Your notes, practice cards, helpful resources, and progress in one
            place.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-xl border border-[#e8e5eb] bg-white px-4 py-2.5 text-sm"
          >
            Edit topic
          </button>
          <button
            onClick={onDelete}
            className="rounded-xl border border-[#f1dfd9] bg-white px-4 py-2.5 text-sm text-[#b27d70]"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-[#eeece8] bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold">How confident do you feel?</h2>
            <span className="text-xs text-[#9691a0]">
              You can change this anytime
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {CONFIDENCE.map((item) => (
              <button
                key={item.value}
                onClick={() =>
                  onUpdate({
                    confidence: item.value,
                    history: [
                      {
                        date: getToday(),
                        result: "confidence updated",
                        confidence: item.value,
                      },
                      ...(topic.history || []),
                    ].slice(0, 100),
                  })
                }
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${topic.confidence === item.value ? "border-[#a69bdc] bg-[#f3f0ff] text-[#6559ad]" : "border-[#eeece8] hover:bg-[#faf9fd]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#eeece8] bg-white p-5">
          <p className="text-xs text-[#9691a0]">NEXT REVIEW</p>
          <p className="mt-2 text-lg font-bold">
            {topic.nextReview
              ? new Date(`${topic.nextReview}T00:00:00`).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" },
                )
              : "Not scheduled"}
          </p>
          <p className="mt-2 text-xs text-[#9691a0]">
            {topic.nextReview && topic.nextReview <= getToday()
              ? "This topic is ready to revise."
              : "Spaced revision schedule"}
          </p>
          <button
            onClick={() => onReview("remembered")}
            className="mt-4 w-full rounded-xl bg-[#7569b8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6256a5]"
          >
            Mark reviewed ✓
          </button>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2.5 text-sm ${activeTab === tab ? "bg-[#7569b8] font-semibold text-white" : "border border-[#e8e5eb] bg-white text-[#777184]"}`}
          >
            {tab}
            {tab === "Flashcards"
              ? ` (${cards.length})`
              : tab === "Resources"
                ? ` (${(topic.resources || []).length})`
                : tab === "Code snippets"
                  ? ` (${(topic.snippets || []).length})`
                  : ""}
          </button>
        ))}
      </div>
      {activeTab === "Notes" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#eeece8] bg-white p-5">
            <h2 className="mb-3 font-bold">Learning notes</h2>
            <textarea
              value={topic.notes || ""}
              onChange={(event) => onUpdate({ notes: event.target.value })}
              rows={8}
              placeholder="Write your explanation, examples, or key takeaways..."
              className="w-full resize-y rounded-xl border border-[#e8e5eb] p-4 text-sm leading-6 outline-none focus:border-[#a39ad8]"
            />
          </section>
          <section className="rounded-2xl border border-[#eeece8] bg-white p-5">
            <h2 className="mb-3 font-bold">What should I revisit?</h2>
            <textarea
              value={topic.revisionNotes || ""}
              onChange={(event) =>
                onUpdate({ revisionNotes: event.target.value })
              }
              rows={4}
              placeholder="What confused you? What should you practise again?"
              className="w-full resize-y rounded-xl border border-[#e8e5eb] p-4 text-sm leading-6 outline-none focus:border-[#a39ad8]"
            />
          </section>
        </div>
      )}
      {activeTab === "Flashcards" && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#eeece8] bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold">Active recall practice</h2>
                <p className="mt-1 text-xs text-[#9691a0]">
                  Try to answer before revealing the back of the card.
                </p>
              </div>
              {cards.length > 0 && (
                <span className="text-xs text-[#9691a0]">
                  Card {practiceIndex + 1} of {cards.length}
                </span>
              )}
            </div>
            {activeCard ? (
              <div className="rounded-2xl bg-[#f7f5fc] p-6 sm:p-8">
                <p className="mb-3 text-[10px] font-bold tracking-[2px] text-[#9b91c9]">
                  {revealed ? "ANSWER" : "QUESTION"}
                </p>
                <p className="whitespace-pre-wrap text-lg font-semibold leading-7">
                  {revealed ? activeCard.answer : activeCard.question}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {!revealed ? (
                    <button
                      onClick={() => setRevealed(true)}
                      className="rounded-xl bg-[#7569b8] px-4 py-3 text-sm font-semibold text-white"
                    >
                      Reveal answer
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => gradeCard(true)}
                        className="rounded-xl bg-[#e9f5ed] px-4 py-3 text-sm font-semibold text-[#548568]"
                      >
                        Got it ✓
                      </button>
                      <button
                        onClick={() => gradeCard(false)}
                        className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm font-semibold text-[#b86f5a]"
                      >
                        Need more practice
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-4 text-xs text-[#9691a0]">
                  Got it: {activeCard.correct || 0} · Needs practice:{" "}
                  {activeCard.needsPractice || 0}
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-[#faf9f7] p-5 text-sm text-[#888494]">
                No flashcards yet. Add a question and answer below to practise
                active recall.
              </p>
            )}
          </section>
          <form
            onSubmit={addFlashcard}
            className="rounded-2xl border border-[#eeece8] bg-white p-5"
          >
            <h3 className="mb-4 font-bold">Create a flashcard</h3>
            <label className="mb-4 block text-sm font-medium">
              Question / prompt
              <textarea
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                placeholder="What is a Python decorator?"
                className="mt-2 w-full rounded-xl border border-[#e8e5eb] p-3 text-sm outline-none focus:border-[#a39ad8]"
              />
            </label>
            <label className="mb-4 block text-sm font-medium">
              Answer
              <textarea
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                placeholder="Explain it in your own words..."
                className="mt-2 w-full rounded-xl border border-[#e8e5eb] p-3 text-sm outline-none focus:border-[#a39ad8]"
              />
            </label>
            <button className="rounded-xl bg-[#7569b8] px-4 py-3 text-sm font-semibold text-white">
              + Add flashcard
            </button>
          </form>
          <div className="space-y-2">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#eeece8] bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {index + 1}. {card.question}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#888494]">
                    {card.answer}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onUpdate({
                      flashcards: cards.filter((item) => item.id !== card.id),
                    });
                    setPracticeIndex(0);
                    setRevealed(false);
                  }}
                  className="text-sm text-[#b27d70]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === "Resources" && (
        <div className="space-y-5">
          <form
            onSubmit={addResource}
            className="rounded-2xl border border-[#eeece8] bg-white p-5"
          >
            <h2 className="mb-4 font-bold">Save a learning resource</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Resource name"
                className="rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
              />
              <input
                required
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://docs.python.org/..."
                className="rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
              />
            </div>
            <button className="mt-3 rounded-xl bg-[#7569b8] px-4 py-3 text-sm font-semibold text-white">
              + Save resource
            </button>
          </form>
          {(topic.resources || []).length ? (
            <div className="space-y-3">
              {topic.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eeece8] bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">{resource.title}</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-xs text-[#7669b6] underline"
                    >
                      {resource.url}
                    </a>
                  </div>
                  <button
                    onClick={() =>
                      onUpdate({
                        resources: topic.resources.filter(
                          (item) => item.id !== resource.id,
                        ),
                      })
                    }
                    className="text-sm text-[#b27d70]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-5 text-sm text-[#888494]">
              Save documentation, course lessons, videos, or GitHub links here.
            </p>
          )}
        </div>
      )}
      {activeTab === "Code snippets" && (
        <div className="space-y-5">
          <form
            onSubmit={addSnippet}
            className="rounded-2xl border border-[#eeece8] bg-white p-5"
          >
            <h2 className="mb-4 font-bold">Save a code snippet</h2>
            <input
              required
              value={snippetTitle}
              onChange={(e) => setSnippetTitle(e.target.value)}
              placeholder="Snippet name, e.g. List comprehension"
              className="mb-3 w-full rounded-xl border border-[#e8e5eb] px-4 py-3 text-sm outline-none focus:border-[#a39ad8]"
            />
            <textarea
              required
              value={snippetCode}
              onChange={(e) => setSnippetCode(e.target.value)}
              rows={6}
              placeholder={'def greet(name):\n    return f"Hello, {name}"'}
              className="w-full rounded-xl border border-[#e8e5eb] p-4 font-mono text-sm outline-none focus:border-[#a39ad8]"
            />
            <button className="mt-3 rounded-xl bg-[#7569b8] px-4 py-3 text-sm font-semibold text-white">
              + Save snippet
            </button>
          </form>
          {(topic.snippets || []).length ? (
            <div className="space-y-3">
              {topic.snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="overflow-hidden rounded-2xl border border-[#eeece8] bg-white"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#eeece8] px-4 py-3">
                    <h3 className="text-sm font-semibold">{snippet.title}</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          navigator.clipboard?.writeText(snippet.code)
                        }
                        className="text-xs text-[#7669b6]"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() =>
                          onUpdate({
                            snippets: topic.snippets.filter(
                              (item) => item.id !== snippet.id,
                            ),
                          })
                        }
                        className="text-xs text-[#b27d70]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap bg-[#29283a] p-4 text-xs leading-6 text-[#f5f2ff]">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-5 text-sm text-[#888494]">
              Keep small examples close to the topic they explain.
            </p>
          )}
        </div>
      )}
      {activeTab === "History" && (
        <div className="rounded-2xl border border-[#eeece8] bg-white p-5">
          <h2 className="mb-4 font-bold">Review history</h2>
          {(topic.history || []).length ? (
            <div className="space-y-3">
              {topic.history.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ede9] pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.result === "remembered"
                        ? "Remembered"
                        : item.result === "hint"
                          ? "Needed a hint"
                          : item.result === "forgotten"
                            ? "Forgot / needs review"
                            : item.result}
                    </p>
                    <p className="mt-1 text-xs text-[#9691a0]">
                      Confidence: {item.confidence || "Not recorded"}
                    </p>
                  </div>
                  <span className="text-xs text-[#9691a0]">{item.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#888494]">
              Your review and confidence changes will appear here.
            </p>
          )}
        </div>
      )}
    </>
  );
}

function formatDateForStorage(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
