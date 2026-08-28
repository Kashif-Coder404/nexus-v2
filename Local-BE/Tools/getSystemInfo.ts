export default async function getSystemInfo() {
  try {
    const res = await fetch("http://localhost:3200/api/system");
    const data: any = await res.json();
    return {success: true, info: JSON.stringify(data)}   
  } catch (error:any) {
    return {success: false, error: "System info not found: " + error.message};
  }
}
