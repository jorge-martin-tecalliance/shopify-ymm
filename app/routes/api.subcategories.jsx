import { json } from "@remix-run/node";
import db from "../db.server";

// POST create new subcategory
export async function action({ request }) {
  const method = request.method;

  if (method === "POST") {
    try {
      const data = await request.json();
      const { name, description, order, categoryId } = data;

      const subcategory = await db.subCategory.create({
        data: {
          name,
          description,
          order: order || 0,
          categoryId
        }
      });

      return json({ subcategory }, { status: 201 });
    } catch (error) {
      console.error("Error creating subcategory:", error);
      return json({ error: "Failed to create subcategory" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
