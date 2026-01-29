import { json } from "@remix-run/node";
import db from "../db.server";

// POST create new part type
export async function action({ request }) {
  const method = request.method;

  if (method === "POST") {
    try {
      const data = await request.json();
      const { name, description, order, subCategoryId } = data;

      const partType = await db.partType.create({
        data: {
          name,
          description,
          order: order || 0,
          subCategoryId
        }
      });

      return json({ partType }, { status: 201 });
    } catch (error) {
      console.error("Error creating part type:", error);
      return json({ error: "Failed to create part type" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
