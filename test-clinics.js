async function run() {
  const res = await fetch('http://localhost:3000/api/clinics');
  const data = await res.json();
  console.log(JSON.stringify(data.data.map(c => ({ name: c.name, bookedCount: c.bookedCount })), null, 2));
}
run();
