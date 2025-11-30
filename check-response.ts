async function test() {
  const res = await fetch('http://localhost:5000/api/work-orders');
  const data = await res.json();
  console.log('Work orders response:', JSON.stringify(data[0], null, 2));
  
  const customersRes = await fetch('http://localhost:5000/api/customers');
  const customers = await customersRes.json();
  console.log('Customers response:', JSON.stringify(customers[0], null, 2));
}
test();
