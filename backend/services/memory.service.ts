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
  userId: string,
  alias: string,
  value: string,
  category: string,
): Promise<object | null> {
  // console.log("UPDATE FUNCTION IS CALLING...");
  if (!category) throw "[UPDATE MEMORY] Category part is Empty";
  if (!alias) throw "[UPDATE MEMORY] Alias part is Empty";
  if (!value) throw "[UPDATE MEMORY] Value part is Empty";
  const cleanedCategory = await categoryClean(category);
  const cleanedValue = await standardizePath(value);
  const cleanedAlias = alias.toLowerCase().trim();
  try {
    const memoryUpdate: object = await MemoryModel.findOneAndUpdate(
      { userId: userId, value: cleanedValue },
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
  userId: string,
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
      userId: userId,
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
  userId: string,
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
      userId: userId,
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

type ActionTypes = {
  memory_write: (
    alias: string,
    category: string,
    value: string,
  ) => Promise<object | null>;
  memory_read: (
    alias: string,
    category: string,
    value?: string,
  ) => Promise<object | null>;
  memory_delete: (
    alias: string,
    category: string,
    value: string,
  ) => Promise<object | null>;
};
export async function accessMemory(
  userId: string,
  action: keyof ActionTypes,
  ...args: Parameters<ActionTypes[keyof ActionTypes]>
) {
  const alias = args[0];
  const category = args[1];
  const value = args[2];

  if (!action)
    return JSON.stringify({
      success: false,
      msg: "action is empty",
      document: null,
    });
  let results: any = null;
  const cleanedAction = action.trim().toLowerCase();
  const cleanedAlias = alias?.trim() || "";
  const cleanedValue = value?.trim() || "";
  const cleanedCategory = category?.trim() || "";
  if (cleanedAction === "memory_write" || cleanedAction.includes("write")) {
    results = await updateMemory(
      userId,
      cleanedAlias,
      cleanedValue,
      cleanedCategory,
    );
  } else if (
    cleanedAction === "memory_read" ||
    cleanedAction.includes("read")
  ) {
    results = await getMemory(userId, cleanedAlias, cleanedCategory);
  } else if (
    cleanedAction === "memory_delete" ||
    cleanedAction.includes("delete")
  ) {
    results = await deleteMemory(
      userId,
      cleanedValue,
      cleanedAlias,
      cleanedCategory,
    );
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
