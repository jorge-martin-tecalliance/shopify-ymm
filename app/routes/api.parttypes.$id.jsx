import { json } from "@remix-run/node";
import db from "../db.server";

// PUT update part type
// DELETE delete part type
export async function action({ request, params }) {
  const method = request.method;
  const { id } = params;

  if (method === "PUT") {
    try {
      const data = await request.json();
      const { name, description, order } = data;

      const partType = await db.partType.update({
        where: { id },
        data: {
          name,
          description,
          order
        }
      });

      return json({ partType });
    } catch (error) {
      console.error("Error updating part type:", error);
      return json({ error: "Failed to update part type" }, { status: 500 });
    }
  }

  if (method === "DELETE") {
    try {
      await db.partType.delete({
        where: { id }
      });

      return json({ success: true });
    } catch (error) {
      console.error("Error deleting part type:", error);
      return json({ error: "Failed to delete part type" }, { status: 500 });
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
