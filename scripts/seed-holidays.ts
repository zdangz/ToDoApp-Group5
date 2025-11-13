import { holidayDB } from '../lib/db';

// Singapore Public Holidays for 2025 and 2026
const holidays = [
  // 2025
  { date: '2025-01-01', name: "New Year's Day", year: 2025 },
  { date: '2025-01-29', name: 'Chinese New Year', year: 2025 },
  { date: '2025-01-30', name: 'Chinese New Year', year: 2025 },
  { date: '2025-04-18', name: 'Good Friday', year: 2025 },
  { date: '2025-05-01', name: 'Labour Day', year: 2025 },
  { date: '2025-05-12', name: 'Vesak Day', year: 2025 },
  { date: '2025-06-06', name: 'Hari Raya Puasa', year: 2025 },
  { date: '2025-08-09', name: 'National Day', year: 2025 },
  { date: '2025-08-13', name: 'Hari Raya Haji', year: 2025 },
  { date: '2025-10-20', name: 'Deepavali', year: 2025 },
  { date: '2025-12-25', name: 'Christmas Day', year: 2025 },
  
  // 2026
  { date: '2026-01-01', name: "New Year's Day", year: 2026 },
  { date: '2026-02-17', name: 'Chinese New Year', year: 2026 },
  { date: '2026-02-18', name: 'Chinese New Year', year: 2026 },
  { date: '2026-04-03', name: 'Good Friday', year: 2026 },
  { date: '2026-05-01', name: 'Labour Day', year: 2026 },
  { date: '2026-05-31', name: 'Vesak Day', year: 2026 },
  { date: '2026-05-26', name: 'Hari Raya Puasa', year: 2026 },
  { date: '2026-08-02', name: 'Hari Raya Haji', year: 2026 },
  { date: '2026-08-09', name: 'National Day', year: 2026 },
  { date: '2026-11-08', name: 'Deepavali', year: 2026 },
  { date: '2026-12-25', name: 'Christmas Day', year: 2026 },
];

async function seedHolidays() {
  try {
    console.log('🌴 Seeding Singapore holidays...');
    
    // Clear existing holidays for these years
    holidayDB.deleteByYear(2025);
    holidayDB.deleteByYear(2026);
    
    // Insert holidays
    let count = 0;
    for (const holiday of holidays) {
      holidayDB.create(holiday.date, holiday.name, holiday.year);
      count++;
    }
    
    console.log(`✅ Successfully seeded ${count} holidays!`);
    console.log('📅 Years covered: 2025, 2026');
    
    // Display summary
    const holidays2025 = holidayDB.getByYear(2025);
    const holidays2026 = holidayDB.getByYear(2026);
    console.log(`   2025: ${holidays2025.length} holidays`);
    console.log(`   2026: ${holidays2026.length} holidays`);
    
  } catch (error) {
    console.error('❌ Error seeding holidays:', error);
    process.exit(1);
  }
}

seedHolidays();
