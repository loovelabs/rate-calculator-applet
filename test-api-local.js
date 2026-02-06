// Test the calculator locally to debug the issue
const { createRateCalculator } = require('./src/calculator');

async function test() {
  try {
    console.log('Creating calculator...');
    const calculator = await createRateCalculator();
    
    console.log('Calculator created successfully');
    
    const input = {
      projectName: "Test Recording Session",
      bookingType: "production",
      mediaType: "audio",
      days: 1,
      staffing: {
        engineer: true,
        hoursPerDay: 8
      },
      equipment: {
        hardDrive: true
      }
    };
    
    console.log('Calculating quote...');
    const result = await calculator.calculate(input);
    
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

test();
