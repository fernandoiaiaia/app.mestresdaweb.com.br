const axios = require('axios');

async function testLogin(email, password) {
  try {
    const response = await axios.post('http://localhost:7777/api/auth/login', {
      email,
      password
    });
    console.log('Login Result for ' + email + ':');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login Failed for ' + email + ':');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

const password = 'FernandinhoCunha@3041***';

async function run() {
  await testLogin('fernando@mestresdaweb.com.br', password);
  console.log('\n-------------------\n');
  await testLogin('contato@mestresdaweb.com.br', password);
}

run();
