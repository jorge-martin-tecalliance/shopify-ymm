import { json } from "@remix-run/node";
import db from "../db.server";

// Public endpoint - no authentication required, with CORS headers
export async function loader({ request }) {
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

    return json({ categories }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
