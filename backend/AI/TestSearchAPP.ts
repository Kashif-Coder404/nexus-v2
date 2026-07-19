import { search } from "../services/search.service.js";

async function testSearchApp() {
  const result: any = await search("D:/Coding/JavaScript", "", "");
  console.log(result);
}
testSearchApp();
