const mockPrisma = {
  category: {
    findMany: jest.fn(),
  },
  tag: {
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getTags } from "@/app/api/tags/route";

const forbiddenFieldNames = [
  "privateKey",
  "secret",
  "token",
  "credential",
  "signer",
  "mnemonic",
  "seedPhrase",
  "adminNotes",
  "internalNotes",
  "botAccountId",
  "botCredentialId",
  "ledgerEntryId",
  "ledgerTransactionId",
  "walletPrivateKey",
  "depositPrivateKey",
];

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectKeys);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
  }

  return [];
};

const expectNoForbiddenKeys = (body: unknown) => {
  const keys = collectKeys(body);
  for (const forbidden of forbiddenFieldNames) {
    expect(keys).not.toContain(forbidden);
  }
};

const expectOnlyKeys = (value: Record<string, unknown>, allowedKeys: string[]) => {
  expect(Object.keys(value).sort()).toEqual([...allowedKeys].sort());
};

describe("public taxonomy API no-leak checks", () => {
  beforeEach(() => {
    mockPrisma.category.findMany.mockReset();
    mockPrisma.tag.findMany.mockReset();
  });

  test("GET /api/categories returns public taxonomy fields without sensitive keys", async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: "category-1",
        name: "Sports",
        slug: "sports",
        parentId: null,
        isActive: true,
        order: 1,
        children: [
          {
            id: "category-2",
            name: "Soccer",
            slug: "soccer",
            parentId: "category-1",
            isActive: true,
            order: 1,
          },
        ],
      },
    ]);

    const response = await getCategories();
    expect(response.status).toBe(200);

    const body = await response.json();
    expectOnlyKeys(body, ["categories"]);
    expect(body.categories).toHaveLength(1);
    expectOnlyKeys(body.categories[0], [
      "children",
      "id",
      "isActive",
      "name",
      "order",
      "parentId",
      "slug",
    ]);
    expectOnlyKeys(body.categories[0].children[0], [
      "id",
      "isActive",
      "name",
      "order",
      "parentId",
      "slug",
    ]);
    expect(body.categories[0]).toMatchObject({
      name: "Sports",
      slug: "sports",
    });
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      where: { parentId: null, isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
    expectNoForbiddenKeys(body);
  });

  test("GET /api/tags returns public tag fields without sensitive keys", async () => {
    mockPrisma.tag.findMany.mockResolvedValue([
      {
        id: "tag-1",
        name: "World Cup",
        slug: "world-cup",
        group: "sports",
        isActive: true,
        order: 1,
      },
    ]);

    const response = await getTags(new Request("http://localhost/api/tags?group=sports"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expectOnlyKeys(body, ["tags"]);
    expect(body.tags).toHaveLength(1);
    expectOnlyKeys(body.tags[0], ["group", "id", "isActive", "name", "order", "slug"]);
    expect(body.tags[0]).toMatchObject({
      name: "World Cup",
      slug: "world-cup",
      group: "sports",
    });
    expectNoForbiddenKeys(body);
    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, group: "sports" },
      }),
    );
  });
});
