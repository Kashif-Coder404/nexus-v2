export default async function getSystemInfo() {
  const res = await fetch("http://localhost:3200/api/system");
  const data: any = await res.json();
  return JSON.stringify(data);
}
