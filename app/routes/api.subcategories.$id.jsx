import { json } from "@remix-run/node";
import db from "../db.server";

// PUT update subcategory
// DELETE delete subcategory
export async function action({ request, params }) {
  const method = request.method;
  const { id } = params;

  if (method === "PUT") {
    try {
      const data = await request.json();
      const { name, description, order } = data;

      const subcategory = await db.subCategory.update({
        where: { id },
        data: {
          name,
          description,
          order
        }
      });

      return json({ subcategory });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      return json({ error: "Failed to update subcategory" }, { status: 500 });
    }
  }

  if (method === "DELETE") {
    try {
      await db.subCategory.delete({
        where: { id }
      });

      return json({ success: true });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      return json({ error: "Failed to delete subcategory" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
