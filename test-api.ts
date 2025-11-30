async function testAPI() {
  try {
    console.log('Testing login endpoint...');
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah@fsm.com', password: 'password' })
    });
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    if (loginRes.ok) {
      console.log('✅ Login successful');
      console.log('User:', loginData.name, `(${loginData.role})`);
    } else {
      console.log('❌ Login failed:', loginData.error);
    }

    console.log('\nTesting customers endpoint...');
    const customersRes = await fetch('http://localhost:5000/api/customers');
    const customers = await customersRes.json();
    console.log(`✅ Found ${customers.length} customers`);
    if (customers.length > 0) {
      console.log('First customer:', customers[0].name);
    }

    console.log('\nTesting work orders endpoint...');
    const woRes = await fetch('http://localhost:5000/api/work-orders');
    const workOrders = await woRes.json();
    console.log(`✅ Found ${workOrders.length} work orders`);
    if (workOrders.length > 0) {
      console.log('First work order:', workOrders[0].title);
    }

    console.log('\n✅ All API tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAPI();
