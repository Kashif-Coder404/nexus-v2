import { MemoryModal } from "../db/schema/memory-schema.js";
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
    const memoryUpdate: object = await MemoryModal.findOneAndUpdate(
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
    console.error("❌ Error saving memory:", error);
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
    const dbResults = await MemoryModal.find({
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
    console.error("❌ Error reading memory:", error);
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
    const deletedMemory = await MemoryModal.findOneAndDelete({
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
    console.error("Error executing findOneAndDelete:", error);
    return { success: false, msg: "An error occurred during deletion." };
  }
};

const testDocuments = [
  {
    value: "C:/Users/Kashif/Desktop/Roblox Player.lnk",
    aliases: ["roblox", "rbx"],
    category: ["game", "app"],
    useCount: 0,
    createdAt: new Date("2026-08-08T07:07:48.261Z"),
    lastAccessedAt: new Date("2026-08-08T07:07:48.261Z"),
  },
  {
    value: "C:/Users/Kashif/Desktop/YouTube.lnk",
    aliases: ["yt", "youtube", "youtube_app"],
    category: ["app"],
    useCount: 16,
    createdAt: new Date("2026-08-07T17:55:16.717Z"),
    lastAccessedAt: new Date(),
  },
  {
    value: "D:/Coding/PROJECTS/NExt/Nexus_v2",
    aliases: ["nexus", "nexus folder", "project folder"],
    category: ["folder"],
    useCount: 42,
    createdAt: new Date("2026-08-01T12:00:00.000Z"),
    lastAccessedAt: new Date(),
  },
  {
    value: "C:/Users/Kashif/AppData/Local/Discord/Update.exe",
    aliases: ["discord", "dc"],
    category: ["app"],
    useCount: 5,
    createdAt: new Date("2026-08-05T09:15:00.000Z"),
    lastAccessedAt: new Date(),
  },
];

// To insert them quickly in your tempRun function:
// await MemoryModal.insertMany(testDocuments);
// console.log("✅ Seeded test documents!");

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
    console.log("UPDATE MEMORY RESULTS: \n", results, " \n");
  } else if (action === "memory_read" || action.includes("read")) {
    results = await getMemory(alias, category);
    console.log("GET MEMORY RESULTS: \n", results, " \n");
  } else if (action === "memory_delete" || action.includes("delete")) {
    results = await deleteMemory(value, alias, category);
    console.log("Delete Memory RESULTS: \n", results, " \n");
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
async function tempRun() {
  // const cmd = "<main_action> | <alias> | <value> | <category>"; // HERE IS THE FORMAT FOR THE INSTRUCTIONS
  // 1. Way to Write in the Memory:
  const accessResult1 = await accessMemory(
    "memory_write | favourite_color | blue | fact ",
  );
  //2. Way to Read from the memory
  const accessResult2 = await accessMemory("memory_read | | | fact ");

  //3. Way to Delete from the memory:
  const accessResult3 = await accessMemory("memory_delete |  |  | ");

  /* 
//EXAMPLE OUTPUT:
UPDATE MEMORY RESULTS: 
 {
  success: true,
  msg: 'Saved to Memory: [favourite_color] -> "blue" as fact',
  document: {
    _id: new ObjectId('6a772de02c4d4fc58d2ef33e'),
    value: 'blue',
    __v: 0,
    aliases: [ 'favourite_color' ],
    category: [ 'fact' ],
    createdAt: 2026-08-08T13:23:44.760Z,
    lastAccessedAt: 2026-08-08T13:23:44.760Z,
    useCount: 0
  }
}  

GET MEMORY RESULTS: 
 {
  success: true,
  msg: 'Memory Search Results for: "" | "fact"',
  document: [ { value: 'blue', alias: [Array], category: [Array] } ]
}  

Delete Memory RESULTS: 
 {
  success: true,
  msg: 'Document deleted successfully!',
  deletedDocument: {
    _id: new ObjectId('6a772de02c4d4fc58d2ef33e'),
    value: 'blue',
    __v: 0,
    aliases: [ 'favourite_color' ],
    category: [ 'fact' ],
    createdAt: 2026-08-08T13:23:44.760Z,
    lastAccessedAt: 2026-08-08T13:23:44.760Z,
    useCount: 0
  }
}  

ACCESS RESULTS: 


 {"success":true,"msg":"Saved to Memory: [favourite_color] -> \"blue\" as fact","document":{"_id":"6a772de02c4d4fc58d2ef33e","value":"blue","__v":0,"aliases":["favourite_color"],"category":["fact"],"createdAt":"2026-08-08T13:23:44.760Z","lastAccessedAt":"2026-08-08T13:23:44.760Z","useCount":0}} 

 {"success":true,"msg":"Memory Search Results for: \"\" | \"fact\"","document":[{"value":"blue","alias":["favourite_color"],"category":["fact"]}]} 

 {"success":true,"msg":"Document deleted successfully!","deletedDocument":{"_id":"6a772de02c4d4fc58d2ef33e","value":"blue","__v":0,"aliases":["favourite_color"],"category":["fact"],"createdAt":"2026-08-08T13:23:44.760Z","lastAccessedAt":"2026-08-08T13:23:44.760Z","useCount":0}} 

  
*/
}
// tempRun();
