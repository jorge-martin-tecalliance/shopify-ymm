import { json } from "@remix-run/node";
import db from "../db.server";

// GET all categories with subcategories and part types
export async function loader() {
  try {
    const categories = await db.category.findMany({
      include: {
        subcategories: {
          include: {
            partTypes: {
              orderBy: { name: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST create new category
export async function action({ request }) {
  const method = request.method;

  if (method === "POST") {
    try {
      const data = await request.json();
      const { name, description, order } = data;

      const category = await db.category.create({
        data: {
          name
        }
      });

      return json({ category }, { status: 201 });
    } catch (error) {
      console.error("Error creating category:", error);
      return json({ error: "Failed to create category" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}