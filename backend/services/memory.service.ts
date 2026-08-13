import { MemoryModel } from "../db/schema/memory-schema.js";

const categoryClean = async (category: string) => {
  let cleanCategory = category.toLowerCase().trim();
  if (cleanCategory.includes("app") || cleanCategory === "software")
    return "app";
  else if (
    cleanCategory.includes("folder") ||
    cleanCategory.includes("dir") ||
    cleanCategory.includes("path")
  )
    return "folder";
  else if (cleanCategory.includes("game")) return "game";
  else if (
    cleanCategory.includes("video") ||
    cleanCategory.includes("audio") ||
    cleanCategory.includes("media") ||
    cleanCategory.includes("youtube_url") ||
    cleanCategory.includes("youtube")
  )
    return "media";
  else return "fact";
};
const standardizePath = async (val: string) => {
  return val.replace(/\\/g, "/").trim();
};

export async function updateMemory(
  alias: string,
  value: string,
  category: string,
): Promise<object | null> {
  const cleanedCategory = await categoryClean(category);
  const cleanedValue = await standardizePath(value);
  const cleanedAlias = alias.toLowerCase().trim();
  try {
    if (!cleanedCategory) throw "[UPDATE MEMORY] Category part is Empty";
    if (!cleanedAlias) throw "[UPDATE MEMORY] Alias part is Empty";
    if (!cleanedValue) throw "[UPDATE MEMORY] Value part is Empty";
    const memoryUpdate: object = await MemoryModel.findOneAndUpdate(
      { value: cleanedValue },
      {
        $addToSet: {
          aliases: cleanedAlias,
          category: cleanedCategory,
        },
        $set: { lastAccessedAt: new Date() },
        $setOnInsert: { createdAt: new Date(), useCount: 0 },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (memoryUpdate) {
      return {
        success: true,
        msg: `Saved to Memory: [${alias}] -> "${value}" as ${cleanedCategory}`,
        document: memoryUpdate,
      };
    }
    return {
      success: false,
      msg: `Cannot save to Memory: [${alias}] -> "${value}" as ${cleanedCategory}`,
      document: memoryUpdate,
    };
  } catch (error: any) {
    console.error("[MEMORY SERVICE] ❌ Error saving memory:", error);
    return {
      success: false,
      msg: `ERROR: ${error} , Failed to save [${alias}] -> "${value}" as ${cleanedCategory} in memory! `,
      document: null,
    };
  }
}

export async function getMemory(
  alias: string,
  category: string = "",
): Promise<object | object[] | null> {
  try {
    const orConditions: any[] = [];
    if (alias) {
      const cleanedAlias = alias.toLowerCase().trim();
      orConditions.push({ aliases: cleanedAlias });
    }
    if (category) {
      const cleanedCategory = await categoryClean(category);
      orConditions.push({ category: cleanedCategory });
    }
    // console.log(orConditions, orConditions.length);
    if (orConditions.length === 0) {
      return {
        success: false,
        msg: "Atleast provide one condition for search memory!",
        document: null,
      };
    }
    const dbResults = await MemoryModel.find({
      $or: orConditions,
    } as any);
    if (dbResults.length === 0) {
      return {
        success: false,
        msg: `No Memory Found!, searched: "${alias}" | "${category}"`,
        document: null,
      };
    }

    const searchResults = dbResults.map((el) => ({
      value: el.value,
      alias: el.aliases,
      category: el.category,
    }));
    if (searchResults)
      return {
        success: true,
        msg: `Memory Search Results for: "${alias}" | "${category}"`,
        document: searchResults,
      };
    return {
      success: false,
      msg: `No Memory Found!, searched: "${alias}" | "${category}"`,
      document: null,
    };
  } catch (error: any) {
    console.error("[MEMORY SERVICE] ❌ Error reading memory:", error);
    return {
      success: false,
      msg: `Failed to Search for Memory!, searched: "${alias}" | "${category}", Error: ${error.message}`,
      document: null,
    };
  }
}

export const deleteMemory = async (
  value: string = "",
  alias: string = "",
  category: string = "",
) => {
  // 1. Initialize an array for dynamic OR conditions
  const orConditions: Record<string, any>[] = [];

  // 2. Safely push cleaned values only if they are defined/truthy
  if (value) {
    const cleanedValue = await standardizePath(value);
    orConditions.push({ value: cleanedValue });
  }

  if (alias) {
    const cleanedAlias = alias.toLowerCase().trim();
    orConditions.push({ aliases: cleanedAlias });
  }

  if (category && (value || alias)) {
    const cleanedCategory = await categoryClean(category);
    orConditions.push({ category: cleanedCategory });
  } else if (!value && !alias) {
    return {
      success: false,
      msg: "Atleast provide one condition (value OR alias) for deleting memory!",
      document: null,
    };
  }

  // 3. Fallback check: If no arguments were provided, exit early without querying
  if (orConditions.length === 0) {
    return { success: false, msg: "No valid delete parameters provided!" };
  }

  try {
    // 4. Single database hit using $or to evaluate all conditions at once
    const deletedMemory = await MemoryModel.findOneAndDelete({
      $or: orConditions,
    });

    if (deletedMemory) {
      return {
        success: true,
        msg: "Document deleted successfully!",
        deletedDocument: deletedMemory,
      };
    }

    return {
      success: false,
      msg: "Document was not found to delete!",
      deletedDocument: null,
    };
  } catch (error) {
    console.error("[MEMORY SERVICE] Error executing findOneAndDelete:", error);
    return { success: false, msg: "An error occurred during deletion." };
  }
};

export async function accessMemory(command: string): Promise<string> {
  if (!command)
    return JSON.stringify({
      success: false,
      msg: "command is empty",
      document: null,
    });
  const commands = command.split("|").map((el) => el.trim());
  let results = null;
  let action = commands[0];
  const alias = commands[1] || "";
  const value = commands[2] || "";
  const category = commands[3] || "";
  if (action === "memory_write" || action.includes("write")) {
    results = await updateMemory(alias, value, category);
  } else if (action === "memory_read" || action.includes("read")) {
    results = await getMemory(alias, category);
  } else if (action === "memory_delete" || action.includes("delete")) {
    results = await deleteMemory(value, alias, category);
  }
  if (results) {
    return JSON.stringify(results);
  }
  return JSON.stringify({
    success: false,
    msg: "Please Provide action from these: memory_write, memory_read, memory_delete",
    document: null,
  });
}
