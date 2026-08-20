import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "../../app";
import { closeDb } from "../../db";
import {
  cleanupFixture,
  jsonHeaders,
  makeSession,
  type OrientationFixture,
} from "../orientation/orientation-test-helpers";

const permissions = [
  "list-syllabus",
  "detail-syllabus",
  "create-syllabus",
  "update-syllabus",
  "delete-syllabus",
  "list-learning-materials",
  "detail-learning-materials",
  "create-learning-materials",
  "update-learning-materials",
  "delete-learning-materials",
  "list-syllabus-categories",
  "detail-syllabus-categories",
  "create-syllabus-categories",
  "update-syllabus-categories",
  "delete-syllabus-categories",
] as const;

const fixtures: OrientationFixture[] = [];

describe("syllabus routes", () => {
  afterEach(async () => {
    while (fixtures.length) await cleanupFixture(fixtures.pop()!);
  });

  it("requires permission and keeps quiz materials in the current syllabus", async () => {
    expect((await app.request("/syllabus/list")).status).toBe(401);
    const limited = await makeSession([]);
    fixtures.push(limited);
    expect(
      (
        await app.request("/syllabus/list", {
          headers: { Cookie: limited.cookie },
        })
      ).status,
    ).toBe(403);

    const fixture = await makeSession(permissions);
    fixtures.push(fixture);
    const headers = jsonHeaders(fixture.cookie);
    const createSyllabus = async (name: string) => {
      const response = await app.request("/syllabus/create", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, description: "Test syllabus" }),
      });
      expect(response.status).toBe(201);
      return ((await response.json()) as { data: { id: string } }).data.id;
    };
    const syllabusId = await createSyllabus("Orientation One");
    const otherSyllabusId = await createSyllabus("Orientation Two");
    const createMaterial = async (parentId: string, name: string) => {
      const response = await app.request("/learning-materials/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          syllabusId: parentId,
          name,
          content: "<p>Content</p>",
          isHaveQuiz: true,
        }),
      });
      expect(response.status).toBe(201);
      return ((await response.json()) as { data: { id: string } }).data.id;
    };
    const materialId = await createMaterial(syllabusId, "Material One");
    const otherMaterialId = await createMaterial(
      otherSyllabusId,
      "Material Two",
    );
    for (const name of ["Question One", "Question Two"]) {
      const response = await app.request(
        `/learning-materials/${materialId}/questions/create`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name,
            answers: [
              { code: "A", name: "Correct", isAnswer: true },
              { code: "B", name: "Wrong", isAnswer: false },
            ],
          }),
        },
      );
      expect(response.status).toBe(201);
    }

    const update = await app.request(`/syllabus/update/${syllabusId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        isHaveQuiz: true,
        quizMaterials: [
          { learningMaterialId: materialId, totalQuestion: 2, active: true },
        ],
      }),
    });
    expect(update.status).toBe(200);
    const updated = (
      (await update.json()) as {
        data: {
          totalQuestion: number;
          quizMaterials: Array<{
            learningMaterialId: string;
            learningMaterial?: { name: string };
          }>;
        };
      }
    ).data;
    expect(updated.totalQuestion).toBe(2);
    expect(updated.quizMaterials).toMatchObject([
      {
        learningMaterialId: materialId,
        learningMaterial: { name: "Material One" },
      },
    ]);

    const crossSyllabus = await app.request(`/syllabus/update/${syllabusId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        quizMaterials: [
          {
            learningMaterialId: otherMaterialId,
            totalQuestion: 1,
            active: true,
          },
        ],
      }),
    });
    expect(crossSyllabus.status).toBe(400);
  });
});

afterAll(() => closeDb());
