import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { holidayDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let holidays;

    if (startDate && endDate) {
      // Get holidays within date range
      holidays = holidayDB.getByDateRange(startDate, endDate);
    } else if (year) {
      // Get holidays for specific year
      holidays = holidayDB.getByYear(parseInt(year));
    } else {
      // Get current year's holidays
      const currentYear = new Date().getFullYear();
      holidays = holidayDB.getByYear(currentYear);
    }

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Get holidays error:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}
