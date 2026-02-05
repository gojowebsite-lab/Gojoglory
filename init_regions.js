const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyA1PxFRRfqjY0EXJqFG-aaVpFC4FZ0b0g4",
  authDomain: "legram-smm.firebaseapp.com",
  databaseURL: "https://legram-smm-default-rtdb.firebaseio.com",
  projectId: "legram-smm",
  storageBucket: "legram-smm.firebasestorage.app",
  messagingSenderId: "904582616067",
  appId: "1:904582616067:web:2f7f30e6455f04ec4f2a36"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const regions = {
  "sa": { region_name: "Middle East", accounts_file: "sa", tier: "premium", enabled: true },
  "pk": { region_name: "Pakistan", accounts_file: "pk", tier: "premium", enabled: true },
  "bd": { region_name: "Bangladesh", accounts_file: "bd", tier: "basic", enabled: true },
  "eu": { region_name: "Europe", accounts_file: "eu", tier: "basic", enabled: true },
  "in": { region_name: "India", accounts_file: "in", tier: "basic", enabled: true },
  "id": { region_name: "Indonesia", accounts_file: "id", tier: "basic", enabled: true },
  "us": { region_name: "North America", accounts_file: "us", tier: "basic", enabled: true },
  "ru": { region_name: "Russia", accounts_file: "ru", tier: "basic", enabled: true },
  "sg": { region_name: "Singapore", accounts_file: "sg", tier: "basic", enabled: true },
  "sac": { region_name: "South America - Spanish(SAC)", accounts_file: "sac", tier: "basic", enabled: true },
  "th": { region_name: "Thailand", accounts_file: "th", tier: "basic", enabled: true },
  "usa": { region_name: "United States (US)", accounts_file: "usa", tier: "basic", enabled: true },
  "vn": { region_name: "Vietnam", accounts_file: "vn", tier: "basic", enabled: true }
};

set(ref(db, 'regions'), regions)
  .then(() => {
    console.log('Regions initialized successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error initializing regions:', err);
    process.exit(1);
  });
