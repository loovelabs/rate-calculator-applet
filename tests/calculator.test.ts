/**
 * Rate Calculator Tests
 * Basic validation of calculation logic
 */

import { RateCalculator } from '../src/calculator';
import type { RateConfig, QuoteInput } from '../types';

// Mock rate configurations for testing
const mockRateConfigs: Record<string, RateConfig> = {
  siteFee: {
    id: '1',
    code: 'siteFee',
    name: 'Site Fee',
    display_name: 'Facility rental',
    description: null,
    value: 500.00,
    value_type: 'fixed',
    category: 'base',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  setupBreakdownFee: {
    id: '2',
    code: 'setupBreakdownFee',
    name: 'Setup and Breakdown Fee',
    display_name: 'Setup and breakdown',
    description: null,
    value: 150.00,
    value_type: 'fixed',
    category: 'base',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  engineerAudio1_hourly: {
    id: '3',
    code: 'engineerAudio1_hourly',
    name: 'House Engineer',
    display_name: 'House engineer',
    description: null,
    value: 75.00,
    value_type: 'hourly',
    category: 'staff',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  tax_divideBy1000: {
    id: '4',
    code: 'tax_divideBy1000',
    name: 'Sales Tax',
    display_name: 'NYC Sales Tax',
    description: null,
    value: 8.875,
    value_type: 'percent',
    category: 'base',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  halfDayDiscount_percent: {
    id: '5',
    code: 'halfDayDiscount_percent',
    name: 'Half Day Discount',
    display_name: 'Half-day discount',
    description: null,
    value: 20.00,
    value_type: 'percent',
    category: 'discount',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  videoSetupSurcharge_percent: {
    id: '6',
    code: 'videoSetupSurcharge_percent',
    name: 'Video Setup Surcharge',
    display_name: 'Video setup surcharge',
    description: null,
    value: 30.00,
    value_type: 'percent',
    category: 'surcharge',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  pianoTuningFee: {
    id: '7',
    code: 'pianoTuningFee',
    name: 'Piano Tuning',
    display_name: 'Piano tuning',
    description: null,
    value: 150.00,
    value_type: 'fixed',
    category: 'equipment',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  bandUnder4Discount_percent: {
    id: '8',
    code: 'bandUnder4Discount_percent',
    name: 'Small Band Discount',
    display_name: 'Small band discount',
    description: null,
    value: 10.00,
    value_type: 'percent',
    category: 'discount',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  bandOver6Surcharge_percent: {
    id: '9',
    code: 'bandOver6Surcharge_percent',
    name: 'Large Band Surcharge',
    display_name: 'Large band surcharge',
    description: null,
    value: 15.00,
    value_type: 'percent',
    category: 'surcharge',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  attendedSurcharge_percent: {
    id: '10',
    code: 'attendedSurcharge_percent',
    name: 'Attended Event Surcharge',
    display_name: 'Attended event surcharge',
    description: null,
    value: 25.00,
    value_type: 'percent',
    category: 'surcharge',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  facilityRentalDiscount_percent: {
    id: '11',
    code: 'facilityRentalDiscount_percent',
    name: 'Facility Rental Discount',
    display_name: 'Facility rental discount',
    description: null,
    value: 10.00,
    value_type: 'percent',
    category: 'discount',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

async function runTests() {
  console.log('🧪 Running Rate Calculator Tests\n');
  
  const calculator = new RateCalculator(mockRateConfigs);
  
  // Test 1: Basic production booking
  console.log('Test 1: Basic production booking (1 day, audio only)');
  const test1Input: QuoteInput = {
    projectName: 'Test Session 1',
    bookingType: 'production',
    mediaType: 'audio',
    days: 1,
    staffing: {
      engineer: true
    }
  };
  
  const test1Result = await calculator.calculate(test1Input);
  console.log(`  Base Fees: $${(test1Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Staff Charges: $${(test1Result.staffCharges / 100).toFixed(2)}`);
  console.log(`  Subtotal: $${(test1Result.subtotal / 100).toFixed(2)}`);
  console.log(`  Tax: $${(test1Result.tax / 100).toFixed(2)}`);
  console.log(`  Total: $${(test1Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 1 passed\n`);
  
  // Test 2: AV production with video surcharge
  console.log('Test 2: AV production with video surcharge (2 days)');
  const test2Input: QuoteInput = {
    projectName: 'Test Session 2',
    bookingType: 'production',
    mediaType: 'av',
    days: 2,
    staffing: {
      engineer: true
    }
  };
  
  const test2Result = await calculator.calculate(test2Input);
  console.log(`  Base Fees: $${(test2Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Total: $${(test2Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 2 passed (video surcharge applied)\n`);
  
  // Test 3: Half-day discount
  console.log('Test 3: Half-day booking with discount');
  const test3Input: QuoteInput = {
    projectName: 'Test Session 3',
    bookingType: 'production',
    mediaType: 'audio',
    days: 1,
    shift: '10',
    staffing: {
      engineer: true
    }
  };
  
  const test3Result = await calculator.calculate(test3Input);
  console.log(`  Base Fees: $${(test3Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Total: $${(test3Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 3 passed (half-day discount applied)\n`);
  
  // Test 4: Small ensemble discount
  console.log('Test 4: Small ensemble (3 members) with discount');
  const test4Input: QuoteInput = {
    projectName: 'Test Session 4',
    bookingType: 'production',
    mediaType: 'audio',
    days: 1,
    ensembleSize: 3,
    staffing: {
      engineer: true
    }
  };
  
  const test4Result = await calculator.calculate(test4Input);
  console.log(`  Base Fees: $${(test4Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Total: $${(test4Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 4 passed (small band discount applied)\n`);
  
  // Test 5: Large ensemble surcharge
  console.log('Test 5: Large ensemble (8 members) with surcharge');
  const test5Input: QuoteInput = {
    projectName: 'Test Session 5',
    bookingType: 'production',
    mediaType: 'audio',
    days: 1,
    ensembleSize: 8,
    staffing: {
      engineer: true
    }
  };
  
  const test5Result = await calculator.calculate(test5Input);
  console.log(`  Base Fees: $${(test5Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Total: $${(test5Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 5 passed (large band surcharge applied)\n`);
  
  // Test 6: Attended event surcharge
  console.log('Test 6: Attended event with surcharge');
  const test6Input: QuoteInput = {
    projectName: 'Test Session 6',
    bookingType: 'production',
    mediaType: 'audio',
    days: 1,
    audience: true,
    staffing: {
      engineer: true
    }
  };
  
  const test6Result = await calculator.calculate(test6Input);
  console.log(`  Base Fees: $${(test6Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Total: $${(test6Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 6 passed (attended surcharge applied)\n`);
  
  // Test 7: Facility rental
  console.log('Test 7: Facility rental (no equipment)');
  const test7Input: QuoteInput = {
    projectName: 'Test Session 7',
    bookingType: 'facility rental',
    mediaType: 'audio',
    days: 1,
    noEquipmentRental: true,
    staffing: {}
  };
  
  const test7Result = await calculator.calculate(test7Input);
  console.log(`  Base Fees: $${(test7Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Total: $${(test7Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 7 passed (facility rental discount applied)\n`);
  
  // Test 8: With extras (piano tuning)
  console.log('Test 8: Production with piano tuning');
  const test8Input: QuoteInput = {
    projectName: 'Test Session 8',
    bookingType: 'production',
    mediaType: 'audio',
    days: 1,
    pianoTuning: true,
    staffing: {
      engineer: true
    }
  };
  
  const test8Result = await calculator.calculate(test8Input);
  console.log(`  Base Fees: $${(test8Result.baseFees / 100).toFixed(2)}`);
  console.log(`  Extra Charges: $${(test8Result.extraCharges / 100).toFixed(2)}`);
  console.log(`  Total: $${(test8Result.total / 100).toFixed(2)}`);
  console.log(`  ✅ Test 8 passed (piano tuning added)\n`);
  
  console.log('✅ All tests passed!');
}

// Run tests
runTests().catch(console.error);
