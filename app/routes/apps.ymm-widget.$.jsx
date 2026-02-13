import { json } from "@remix-run/node";
import db from "../db.server";

// App proxy catch-all route - handles /apps/ymm-widget/*
export async function loader({ params }) {
  const splat = params["*"];
  
  // Handle /apps/ymm-widget/api/categories/public
  if (splat === "api/categories/public") {
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
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return json({ error: "Failed to fetch categories" }, { status: 500 });
    }
  }

  return json({ error: "Not found" }, { status: 404 });
}
