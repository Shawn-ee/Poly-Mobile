export type ProviderSlugReviewInput = {
  marketId: string;
  slugs: string[];
};

export function parseProviderSlugReviewInput(input: string): ProviderSlugReviewInput[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseJsonReviewInput(trimmed);
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseReviewLine);
}

function parseJsonReviewInput(input: string): ProviderSlugReviewInput[] {
  const parsed = JSON.parse(input) as unknown;
  const reviewList = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.reviews)
      ? parsed.reviews
      : null;

  if (!reviewList) {
    throw new Error("JSON input must be an array or an object with reviews[].");
  }

  return reviewList.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Review ${index + 1} must be an object.`);
    }
    const marketId = String(item.marketId ?? "").trim();
    const slugs = Array.isArray(item.slugs)
      ? item.slugs.map((slug) => String(slug).trim()).filter(Boolean)
      : typeof item.slug === "string"
        ? [item.slug.trim()].filter(Boolean)
        : [];

    return normalizeReview({ marketId, slugs }, index + 1);
  });
}

function parseReviewLine(line: string, index: number): ProviderSlugReviewInput {
  const separator = line.includes("=") ? "=" : line.includes(":") ? ":" : null;
  if (!separator) {
    throw new Error(`Line ${index + 1} must use marketId=slug or marketId:slug.`);
  }

  const [marketId, slugText] = splitOnce(line, separator);
  return normalizeReview(
    {
      marketId: marketId.trim(),
      slugs: slugText
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    },
    index + 1,
  );
}

function normalizeReview(review: ProviderSlugReviewInput, position: number): ProviderSlugReviewInput {
  if (!review.marketId) {
    throw new Error(`Review ${position} is missing marketId.`);
  }
  if (review.slugs.length === 0) {
    throw new Error(`Review ${position} must include at least one Polymarket slug.`);
  }
  return review;
}

function splitOnce(value: string, separator: string) {
  const index = value.indexOf(separator);
  return [value.slice(0, index), value.slice(index + separator.length)] as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
