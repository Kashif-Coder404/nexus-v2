export default async function getSystemInfo() {
  const res = await fetch("http://192.168.31.116:3000/api/system");
  const data: any = await res.json();
  return JSON.stringify(data);
}
