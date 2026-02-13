import { json } from "@remix-run/node";
import db from "../db.server";

// PUT update category
// DELETE delete category
export async function action({ request, params }) {
  const method = request.method;
  const { id } = params;

  if (method === "PUT") {
    try {
      const data = await request.json();
      const { name, description, order } = data;

      const category = await db.category.update({
        where: { id },
        data: {
          name,
          description,
          order
        }
      });

      return json({ category });
    } catch (error) {
      console.error("Error updating category:", error);
      return json({ error: "Failed to update category" }, { status: 500 });
    }
  }

  if (method === "DELETE") {
    try {
      await db.category.delete({
        where: { id }
      });

      return json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      return json({ error: "Failed to delete category" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
