"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Market = {
  id: string;
  title: string;
  description: string;
  status: string;
  outcomes: { id: string; name: string }[];
  resolvedOutcomeId?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  group: string | null;
};

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ isAdmin: boolean } | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resolveTime, setResolveTime] = useState("");
  const [marketType, setMarketType] = useState<"BINARY" | "MULTI_WINNER">("BINARY");
  const [outcomeLines, setOutcomeLines] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [topCategoryId, setTopCategoryId] = useState("");
  const [childCategoryId, setChildCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const [message, setMessage] = useState("");
  const [resolveMarketId, setResolveMarketId] = useState<string | null>(null);
  const [resolveOutcomeId, setResolveOutcomeId] = useState<string | null>(null);
  const [resolveOutcomes, setResolveOutcomes] = useState<
    { id: string; name: string; isActive: boolean }[]
  >([]);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formCollapsed, setFormCollapsed] = useState(true);
  const [editMarketId, setEditMarketId] = useState<string | null>(null);
  const [editMarket, setEditMarket] = useState<Market | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editResolveTime, setEditResolveTime] = useState("");
  const [editTopCategoryId, setEditTopCategoryId] = useState("");
  const [editChildCategoryId, setEditChildCategoryId] = useState("");
  const [editOutcomes, setEditOutcomes] = useState<
    {
      id?: string;
      name: string;
      isActive: boolean;
      displayOrder: number;
      locked?: boolean;
    }[]
  >([]);
  const [newOutcomeName, setNewOutcomeName] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const statusOptions = useMemo(
    () => ["ALL", "UPCOMING", "LIVE", "CLOSED", "RESOLVED"],
    []
  );

  const loadMarkets = async (options?: {
    nextPage?: number;
    nextSearch?: string;
    nextStatus?: string;
  }) => {
    const params = new URLSearchParams();
    const searchValue = options?.nextSearch ?? debouncedSearch;
    const statusValue = options?.nextStatus ?? statusFilter;
    if (searchValue.trim()) params.set("search", searchValue.trim());
    if (statusValue && statusValue !== "ALL") params.set("status", statusValue);
    const pageToUse = options?.nextPage ?? page;
    params.set("page", String(pageToUse));
    params.set("pageSize", "20");
    const res = await fetch(`/api/admin/markets?${params.toString()}`);
    const data = await res.json();
    setMarkets(data.items ?? []);
    setTotalMarkets(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  };

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    };
    loadUser();
    const initialSearch = searchParams.get("search") ?? "";
    const initialStatus = searchParams.get("status") ?? "ALL";
    const initialPage = Number(searchParams.get("page") ?? 1);

    setSearch(initialSearch);
    setDebouncedSearch(initialSearch);
    setStatusFilter(initialStatus.toUpperCase());
    setPage(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);

    loadMarkets({
      nextPage: initialPage,
      nextSearch: initialSearch,
      nextStatus: initialStatus.toUpperCase(),
    });

    const loadCategories = async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories ?? []);
    };

    const loadTags = async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) return;
      const data = await res.json();
      setSuggestedTags(data.tags ?? []);
    };

    loadCategories();
    loadTags();

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("adminCreateMarketCollapsed")
        : null;
    if (stored !== null) {
      setFormCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    loadMarkets();
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
    params.set("page", String(page));
    router.replace(`/admin?${params.toString()}`);
  }, [statusFilter, debouncedSearch, page]);

  const createMarket = async () => {
    setMessage("");
    const categoryId = childCategoryId || topCategoryId || null;
    const res = await fetch("/api/admin/markets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        resolveTime,
        categoryId,
        tags,
        type: marketType,
        outcomes:
          marketType === "MULTI_WINNER"
            ? outcomeLines
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
            : [],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to create market.");
      return;
    }
    setTitle("");
    setDescription("");
    setResolveTime("");
    setMarketType("BINARY");
    setOutcomeLines("");
    setTopCategoryId("");
    setChildCategoryId("");
    setTags([]);
    setTagInput("");
    setMessage("Market created.");
    await loadMarkets();
  };

  const togglePause = async (market: Market) => {
    const nextStatus =
      market.status === "UPCOMING" ||
      market.status === "CLOSED" ||
      market.status === "PAUSED"
        ? "LIVE"
        : "CLOSED";
    const res = await fetch("/api/admin/markets/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: market.id, status: nextStatus }),
    });
    if (res.ok) {
      await loadMarkets();
    }
  };

  const resolveMarket = async () => {
    if (!resolveMarketId || !resolveOutcomeId) {
      setResolveMessage("Select an outcome.");
      return;
    }
    const selectedOutcome = resolveOutcomes.find(
      (outcome) => outcome.id === resolveOutcomeId
    );
    if (selectedOutcome && !selectedOutcome.isActive) {
      const ok = window.confirm(
        "This outcome is inactive. Resolve anyway?"
      );
      if (!ok) return;
    }
    const res = await fetch("/api/admin/markets/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId: resolveMarketId, outcomeId: resolveOutcomeId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setResolveMessage(data?.error ?? "Failed to resolve market.");
      return;
    }
    setResolveMessage("Market resolved.");
    setResolveMarketId(null);
    setResolveOutcomeId(null);
    setResolveOutcomes([]);
    await loadMarkets();
  };

  const openResolve = async (marketId: string) => {
    setResolveMarketId(marketId);
    setResolveOutcomeId(null);
    setResolveMessage("");
    setResolveLoading(true);
    try {
      const res = await fetch(`/api/admin/markets/${marketId}`);
      const data = await res.json();
      if (!res.ok) {
        setResolveMessage(data.error ?? "Failed to load outcomes.");
        setResolveOutcomes([]);
        return;
      }
      setResolveOutcomes(
        (data.market?.outcomes ?? []).map((outcome: any) => ({
          id: outcome.id,
          name: outcome.name,
          isActive: outcome.isActive !== false,
        }))
      );
    } finally {
      setResolveLoading(false);
    }
  };

  const openEdit = async (marketId: string) => {
    setEditMessage("");
    const res = await fetch(`/api/admin/markets/${marketId}`);
    const data = await res.json();
    if (!res.ok) {
      setEditMessage(data.error ?? "Failed to load market.");
      return;
    }
    const market = data.market as {
      id: string;
      title: string;
      description: string;
      resolveTime: string | null;
      categoryId: string | null;
      outcomes: {
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        locked: boolean;
      }[];
    };
    setEditMarketId(market.id);
    setEditMarket({
      id: market.id,
      title: market.title,
      description: market.description,
      status: "",
      outcomes: market.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
      })),
      resolvedOutcomeId: null,
    });
    setEditTitle(market.title);
    setEditDescription(market.description);
    setEditResolveTime(market.resolveTime ?? "");
    setEditTopCategoryId(market.categoryId ?? "");
    setEditChildCategoryId("");
    setEditOutcomes(
      market.outcomes.map((outcome, index) => ({
        id: outcome.id,
        name: outcome.name,
        isActive: outcome.isActive,
        displayOrder: outcome.displayOrder ?? index,
        locked: outcome.locked,
      }))
    );
  };

  const saveEdit = async () => {
    if (!editMarketId) return;
    setEditMessage("");
    const categoryId = editChildCategoryId || editTopCategoryId || null;
    const res = await fetch(`/api/admin/markets/${editMarketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        resolveTime: editResolveTime,
        categoryId,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setEditMessage(data?.error ?? "Failed to update market.");
      return;
    }

    const outcomeRes = await fetch(
      `/api/admin/markets/${editMarketId}/outcomes`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcomes: editOutcomes.map((outcome) => ({
            id: outcome.id,
            name: outcome.name,
            isActive: outcome.isActive,
            displayOrder: outcome.displayOrder,
          })),
        }),
      }
    );
    const outcomeData = await outcomeRes.json().catch(() => null);
    if (!outcomeRes.ok) {
      setEditMessage(outcomeData?.error ?? "Failed to update outcomes.");
      return;
    }
    setEditMessage("Market updated.");
    setEditMarketId(null);
    setEditMarket(null);
    await loadMarkets();
  };

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-neutral-600">Log in to access admin tools.</p>
      </main>
    );
  }

  if (!user.isAdmin) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-neutral-600">You are not an admin.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link
          href="/admin/reference-markets"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
        >
          Reference Markets Review
        </Link>
        <Link
          href="/admin/deposits"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
        >
          Deposits
        </Link>
      </div>
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create market</h2>
          <button
            onClick={() => {
              const next = !formCollapsed;
              setFormCollapsed(next);
              window.localStorage.setItem(
                "adminCreateMarketCollapsed",
                String(next)
              );
            }}
            className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
            type="button"
          >
            {formCollapsed ? "Expand" : "Hide"}
          </button>
        </div>
        {!formCollapsed ? (
          <div className="mt-3 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <div>
              <label className="text-sm font-medium">Market type</label>
              <select
                value={marketType}
                onChange={(event) =>
                  setMarketType(event.target.value as "BINARY" | "MULTI_WINNER")
                }
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="BINARY">Binary (YES/NO)</option>
                <option value="MULTI_WINNER">Multi-winner (one-of-N)</option>
              </select>
            </div>
            {marketType === "MULTI_WINNER" ? (
              <div>
                <label className="text-sm font-medium">Outcomes (one per line)</label>
                <textarea
                  value={outcomeLines}
                  onChange={(event) => setOutcomeLines(event.target.value)}
                  placeholder="Player A&#10;Player B&#10;Player C"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
            ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={topCategoryId}
                onChange={(event) => {
                  setTopCategoryId(event.target.value);
                  setChildCategoryId("");
                }}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Subcategory</label>
              <select
                value={childCategoryId}
                onChange={(event) => setChildCategoryId(event.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                disabled={!topCategoryId}
              >
                <option value="">None</option>
                {categories
                  .find((category) => category.id === topCategoryId)
                  ?.children?.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTags(tags.filter((item) => item !== tag))}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
                  type="button"
                >
                  {tag} ×
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="Add tag"
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  const value = tagInput.trim();
                  if (!value) return;
                  if (!tags.includes(value)) {
                    setTags([...tags, value]);
                  }
                  setTagInput("");
                }}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                type="button"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (!tags.includes(tag.name)) {
                      setTags([...tags, tag.name]);
                    }
                  }}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
                  type="button"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <input
            value={resolveTime}
            onChange={(event) => setResolveTime(event.target.value)}
            placeholder="Resolve time (optional, ISO)"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            onClick={createMarket}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900"
            type="button"
          >
            Create
          </button>
          {message ? (
            <div className="text-sm text-neutral-600">{message}</div>
          ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search markets"
            className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2 text-xs">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-1 ${
                  statusFilter === status
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-700"
                }`}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {markets.map((market) => (
          <div
            key={market.id}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{market.title}</div>
                <div className="text-sm text-neutral-600">
                  {market.description}
                </div>
                {market.resolvedOutcomeId ? (
                  <div className="mt-1 text-xs text-neutral-500">
                    Resolved outcome:{" "}
                    {market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.name ??
                      "—"}
                  </div>
                ) : null}
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs uppercase text-neutral-600">
                {market.status}
              </span>
            </div>
            <div className="mt-3 flex gap-3 text-sm">
              <button
                onClick={() => togglePause(market)}
                className="rounded-md border border-neutral-300 px-3 py-1"
                type="button"
              >
                {market.status === "LIVE" || market.status === "ACTIVE" ? "Close" : "Go live"}
              </button>
              <button
                onClick={() => openEdit(market.id)}
                className="rounded-md border border-neutral-300 px-3 py-1"
                type="button"
              >
                Edit
              </button>
              <button
                onClick={() => openResolve(market.id)}
                className="rounded-md border border-neutral-300 px-3 py-1"
                type="button"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
        <div>
          Page {page} of {totalPages} · Total {totalMarkets}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 disabled:opacity-50"
            type="button"
            disabled={page <= 1}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 disabled:opacity-50"
            type="button"
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {resolveMarketId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold">Resolve market</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Select the winning outcome and confirm. This cannot be undone.
            </p>
            <div className="mt-4 space-y-2">
              {resolveLoading ? (
                <div className="text-sm text-neutral-500">Loading outcomes...</div>
              ) : (
                resolveOutcomes.map((outcome) => (
                  <button
                    key={outcome.id}
                    onClick={() => setResolveOutcomeId(outcome.id)}
                    className={`w-full rounded-md border px-3 py-2 text-sm text-left ${
                      resolveOutcomeId === outcome.id
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 text-neutral-700"
                    }`}
                    type="button"
                  >
                    {outcome.name}
                    {!outcome.isActive ? " (inactive)" : ""}
                  </button>
                ))
              )}
            </div>
            {resolveMessage ? (
              <div className="mt-3 text-sm text-neutral-600">
                {resolveMessage}
              </div>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setResolveMarketId(null)}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={resolveMarket}
                className="flex-1 rounded-md bg-black px-3 py-2 text-sm text-white"
                type="button"
              >
                Confirm resolve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editMarketId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
              <h3 className="text-lg font-semibold">Edit market</h3>
              <button
                onClick={() => setEditMarketId(null)}
                className="text-sm text-neutral-500"
                type="button"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={editTopCategoryId}
                    onChange={(event) => {
                      setEditTopCategoryId(event.target.value);
                      setEditChildCategoryId("");
                    }}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subcategory</label>
                  <select
                    value={editChildCategoryId}
                    onChange={(event) => setEditChildCategoryId(event.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    disabled={!editTopCategoryId}
                  >
                    <option value="">None</option>
                    {categories
                      .find((category) => category.id === editTopCategoryId)
                      ?.children?.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Resolve time</label>
                <input
                  value={editResolveTime}
                  onChange={(event) => setEditResolveTime(event.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Resolve time (optional, ISO)"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Outcomes</label>
                  <div className="text-xs text-neutral-500">
                    Locked outcomes cannot be renamed or removed.
                  </div>
                </div>
                <div className="mt-2 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                  {editOutcomes
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((outcome, index) => (
                      <div
                        key={outcome.id ?? `${outcome.name}-${index}`}
                        className="flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-2"
                      >
                        <button
                          onClick={() => {
                            if (index === 0) return;
                            const copy = [...editOutcomes];
                            const current = copy[index];
                            copy[index] = copy[index - 1];
                            copy[index - 1] = current;
                            copy.forEach((item, idx) => {
                              item.displayOrder = idx;
                            });
                            setEditOutcomes(copy);
                          }}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => {
                            if (index === editOutcomes.length - 1) return;
                            const copy = [...editOutcomes];
                            const current = copy[index];
                            copy[index] = copy[index + 1];
                            copy[index + 1] = current;
                            copy.forEach((item, idx) => {
                              item.displayOrder = idx;
                            });
                            setEditOutcomes(copy);
                          }}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
                          type="button"
                        >
                          ↓
                        </button>
                        <input
                          value={outcome.name}
                          onChange={(event) => {
                            const copy = [...editOutcomes];
                            copy[index] = {
                              ...outcome,
                              name: event.target.value,
                            };
                            setEditOutcomes(copy);
                          }}
                          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                          disabled={outcome.locked}
                        />
                        <label className="flex items-center gap-1 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            checked={outcome.isActive}
                            onChange={(event) => {
                              const copy = [...editOutcomes];
                              copy[index] = {
                                ...outcome,
                                isActive: event.target.checked,
                              };
                              setEditOutcomes(copy);
                            }}
                          />
                          Active
                        </label>
                        {outcome.locked ? (
                          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500">
                            Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setEditOutcomes(
                                editOutcomes.filter((_, idx) => idx !== index)
                              );
                            }}
                            className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
                            type="button"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newOutcomeName}
                    onChange={(event) => setNewOutcomeName(event.target.value)}
                    placeholder="Add outcome"
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      const value = newOutcomeName.trim();
                      if (!value) return;
                      setEditOutcomes([
                        ...editOutcomes,
                        {
                          name: value,
                          isActive: true,
                          displayOrder: editOutcomes.length,
                        },
                      ]);
                      setNewOutcomeName("");
                    }}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    type="button"
                  >
                    Add
                  </button>
                </div>
              </div>
              {editMessage ? (
                <div className="text-sm text-neutral-600">{editMessage}</div>
              ) : null}
              </div>
            </div>
            <div className="sticky bottom-0 z-10 flex gap-2 border-t border-neutral-200 bg-white px-5 py-4">
              <button
                onClick={() => setEditMarketId(null)}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 rounded-md bg-black px-3 py-2 text-sm text-white"
                type="button"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-sm text-neutral-600">Loading admin tools...</p>
        </main>
      }
    >
      <AdminPageInner />
    </Suspense>
  );
}
