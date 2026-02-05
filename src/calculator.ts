import type { RateConfig, QuoteInput, QuoteCalculation, QuoteLineItem } from '../types';
import { getRateConfigs, getDiscountCode } from '../lib/supabase';

/**
 * Main calculation engine for rate calculator
 * Implements the logic from V1 Quote.computeTotals
 */
export class RateCalculator {
  private configs: Record<string, RateConfig> = {};
  
  constructor(configs: Record<string, RateConfig>) {
    this.configs = configs;
  }
  
  /**
   * Get rate value by code, with error handling
   */
  private getRate(code: string): number {
    const config = this.configs[code];
    if (!config) {
      console.warn(`Rate config not found: ${code}`);
      return 0;
    }
    return config.value;
  }
  
  /**
   * Determine hours based on booking length and type
   */
  private calculateHours(input: QuoteInput): { audioHours: number; videoHours: number } {
    if (input.hours) {
      return { audioHours: input.hours, videoHours: input.hours };
    }
    
    // Half day: 6 hours
    if (input.shift) {
      return { audioHours: 6, videoHours: 6 };
    }
    
    // Full day: 10 hours
    return { audioHours: 10, videoHours: 10 };
  }
  
  /**
   * Calculate base facility fees with surcharges
   * Step 1-3 from PRD: Base fees, percentage surcharges, percentage discounts
   */
  private calculateBaseFees(input: QuoteInput): {
    lineItems: QuoteLineItem[];
    total: number;
  } {
    const lineItems: QuoteLineItem[] = [];
    let displayOrder = 1;
    
    // Get base rates
    const siteFee = this.getRate('siteFee');
    const setupBreakdownFee = this.getRate('setupBreakdownFee');
    
    // Calculate surcharges
    let siteFeeWithSurcharges = siteFee;
    let setupBreakdownWithSurcharges = setupBreakdownFee;
    
    // Apply video setup surcharge (if applicable)
    if (input.mediaType === 'av' && input.bookingType === 'production') {
      const videoSurchargePercent = this.getRate('videoSetupSurcharge_percent');
      const videoSurcharge = siteFee * (videoSurchargePercent / 100);
      siteFeeWithSurcharges += videoSurcharge;
      setupBreakdownWithSurcharges += setupBreakdownFee * (videoSurchargePercent / 100);
    }
    
    // Apply large band surcharge (7+ members)
    if (input.ensembleSize && input.ensembleSize >= 7) {
      const bandSurchargePercent = this.getRate('bandOver6Surcharge_percent');
      const bandSurcharge = siteFeeWithSurcharges * (bandSurchargePercent / 100);
      siteFeeWithSurcharges += bandSurcharge;
      setupBreakdownWithSurcharges += setupBreakdownWithSurcharges * (bandSurchargePercent / 100);
    }
    
    // Apply attended event surcharge
    if (input.audience) {
      const attendedSurchargePercent = this.getRate('attendedSurcharge_percent');
      const attendedSurcharge = siteFeeWithSurcharges * (attendedSurchargePercent / 100);
      siteFeeWithSurcharges += attendedSurcharge;
      setupBreakdownWithSurcharges += setupBreakdownWithSurcharges * (attendedSurchargePercent / 100);
    }
    
    // Apply discounts
    let siteFeeAfterDiscounts = siteFeeWithSurcharges;
    let setupBreakdownAfterDiscounts = setupBreakdownWithSurcharges;
    
    // Facility rental discount (if applicable)
    if (input.bookingType === 'facility rental') {
      const facilityDiscountPercent = this.getRate('facilityRentalDiscount_percent');
      siteFeeAfterDiscounts -= siteFeeWithSurcharges * (facilityDiscountPercent / 100);
      setupBreakdownAfterDiscounts -= setupBreakdownWithSurcharges * (facilityDiscountPercent / 100);
    }
    
    // Half-day discount
    if (input.shift) {
      const halfDayDiscountPercent = this.getRate('halfDayDiscount_percent');
      siteFeeAfterDiscounts -= siteFeeAfterDiscounts * (halfDayDiscountPercent / 100);
      setupBreakdownAfterDiscounts -= setupBreakdownAfterDiscounts * (halfDayDiscountPercent / 100);
    }
    
    // Small band discount (1-3 members)
    if (input.ensembleSize && input.ensembleSize <= 3) {
      const bandDiscountPercent = this.getRate('bandUnder4Discount_percent');
      siteFeeAfterDiscounts -= siteFeeAfterDiscounts * (bandDiscountPercent / 100);
      setupBreakdownAfterDiscounts -= setupBreakdownAfterDiscounts * (bandDiscountPercent / 100);
    }
    
    // Add site fee line item
    const siteFeeTotal = Math.round(siteFeeAfterDiscounts * 100) * input.days;
    lineItems.push({
      category: 'base',
      description: this.getBookingTypeHeader(input),
      quantity: input.days,
      unit_price_cents: Math.round(siteFeeAfterDiscounts * 100),
      total_cents: siteFeeTotal,
      display_order: displayOrder++
    });
    
    let total = siteFeeTotal;
    
    // Add setup/breakdown fee if applicable
    if (this.shouldIncludeSetupBreakdown(input)) {
      const setupTotal = Math.round(setupBreakdownAfterDiscounts * 100);
      lineItems.push({
        category: 'base',
        description: 'Setup and breakdown fee',
        quantity: 1,
        unit_price_cents: setupTotal,
        total_cents: setupTotal,
        display_order: displayOrder++
      });
      total += setupTotal;
    }
    
    return { lineItems, total };
  }
  
  /**
   * Determine if setup/breakdown fee should be included
   */
  private shouldIncludeSetupBreakdown(input: QuoteInput): boolean {
    if (input.bookingType === 'production' || input.bookingType === 'post') {
      return true;
    }
    if (input.bookingType === 'facility rental' && !input.noEquipmentRental) {
      return true;
    }
    return false;
  }
  
  /**
   * Get booking type header string
   */
  private getBookingTypeHeader(input: QuoteInput): string {
    const shiftStr = input.shift ? ' (Half day)' : ' (Full day)';
    
    if (input.bookingType === 'production') {
      return `Production session${shiftStr}`;
    } else if (input.bookingType === 'post') {
      return `Post-production session${shiftStr}`;
    } else {
      return `Facility rental${shiftStr}`;
    }
  }
  
  /**
   * Calculate hourly staffing costs
   * Step 4 from PRD
   */
  private calculateStaffCharges(input: QuoteInput): {
    lineItems: QuoteLineItem[];
    total: number;
  } {
    const lineItems: QuoteLineItem[] = [];
    const { audioHours, videoHours } = this.calculateHours(input);
    let displayOrder = 100; // Start after base fees
    let total = 0;
    
    // Audio staff
    if (input.staffing.engineer) {
      const rate = this.getRate('engineerAudio1_hourly');
      const dailyCost = rate * audioHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'audio',
        description: `House engineer (${audioHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.tech) {
      const rate = this.getRate('engineerAudio2_hourly');
      const dailyCost = rate * audioHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'audio',
        description: `House tech (${audioHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.audioAssistant) {
      const rate = this.getRate('assistantAudio_hourly');
      const dailyCost = rate * audioHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'audio',
        description: `Audio assistant (${audioHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    // Video staff
    if (input.staffing.dpSwitcher) {
      const rate = this.getRate('dpswitcher_hourly');
      const dailyCost = rate * videoHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'video',
        description: `DP/Switcher (${videoHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.camera1) {
      const rate = this.getRate('camera1_hourly');
      const dailyCost = rate * videoHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'video',
        description: `Camera operator 1 (${videoHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.camera2) {
      const rate = this.getRate('camera2_hourly');
      const dailyCost = rate * videoHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'video',
        description: `Camera operator 2 (${videoHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.camera3) {
      const rate = this.getRate('camera3_hourly');
      const dailyCost = rate * videoHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'video',
        description: `Camera operator 3 (${videoHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    // Other staff
    if (input.staffing.siteAssistant) {
      const rate = this.getRate('siteAssistant_hourly');
      const dailyCost = rate * audioHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'extra',
        description: `Facility assistant (${audioHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.security) {
      const rate = this.getRate('security_hourly');
      const dailyCost = rate * audioHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'extra',
        description: `Security (${audioHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    if (input.staffing.hospitalityAssistant) {
      const rate = this.getRate('hospitalityAssistant_hourly');
      const dailyCost = rate * audioHours;
      const totalCost = Math.round(dailyCost * 100) * input.days;
      lineItems.push({
        category: 'extra',
        description: `Hospitality assistant (${audioHours}hrs/day)`,
        quantity: input.days,
        unit_price_cents: Math.round(dailyCost * 100),
        total_cents: totalCost,
        display_order: displayOrder++
      });
      total += totalCost;
    }
    
    return { lineItems, total };
  }
  
  /**
   * Calculate fixed equipment and misc costs
   * Step 5 from PRD
   */
  private calculateExtraCharges(input: QuoteInput): {
    lineItems: QuoteLineItem[];
    total: number;
  } {
    const lineItems: QuoteLineItem[] = [];
    let displayOrder = 200; // Start after staff
    let total = 0;
    
    // Media storage
    if (input.mediaStorage && input.mediaStorage !== 'Own HD') {
      let rateCode = '';
      if (input.mediaStorage === 'Hard Drive') rateCode = 'hardDrive';
      else if (input.mediaStorage === 'DVD') rateCode = 'dvdRefs';
      else if (input.mediaStorage === 'CD-R') rateCode = 'cdRefs';
      
      if (rateCode) {
        const cost = Math.round(this.getRate(rateCode) * 100);
        lineItems.push({
          category: 'extra',
          description: input.mediaStorage,
          quantity: 1,
          unit_price_cents: cost,
          total_cents: cost,
          display_order: displayOrder++
        });
        total += cost;
      }
    }
    
    // Piano tuning
    if (input.pianoTuning || input.customTuning) {
      const cost = Math.round(this.getRate('pianoTuningFee') * 100);
      lineItems.push({
        category: 'extra',
        description: input.customTuning ? 'Custom piano tuning' : 'Piano tuning',
        quantity: 1,
        unit_price_cents: cost,
        total_cents: cost,
        display_order: displayOrder++
      });
      total += cost;
    }
    
    // Miscellaneous charges
    if (input.miscCharge && input.miscCharge > 0) {
      const cost = Math.round(input.miscCharge * 100);
      lineItems.push({
        category: 'extra',
        description: input.miscDescription || 'Miscellaneous charges',
        quantity: 1,
        unit_price_cents: cost,
        total_cents: cost,
        display_order: displayOrder++
      });
      total += cost;
    }
    
    return { lineItems, total };
  }
  
  /**
   * Calculate tax
   * Step 8 from PRD
   */
  private calculateTax(subtotal: number): number {
    const taxRate = this.getRate('tax_divideBy1000');
    return Math.round((subtotal * taxRate) / 1000);
  }
  
  /**
   * Main calculation method
   * Orchestrates all calculation steps
   */
  async calculate(input: QuoteInput): Promise<QuoteCalculation> {
    const allLineItems: QuoteLineItem[] = [];
    
    // Step 1-3: Base fees with surcharges and discounts
    const baseFees = this.calculateBaseFees(input);
    allLineItems.push(...baseFees.lineItems);
    
    // Step 4: Hourly staffing costs
    const staffCharges = this.calculateStaffCharges(input);
    allLineItems.push(...staffCharges.lineItems);
    
    // Step 5: Fixed equipment & misc costs
    const extraCharges = this.calculateExtraCharges(input);
    allLineItems.push(...extraCharges.lineItems);
    
    // Step 6: Calculate subtotal
    const subtotal = baseFees.total + staffCharges.total + extraCharges.total;
    
    // Step 7: Apply discount code (if provided)
    // TODO: Implement discount code logic
    
    // Step 8: Calculate tax
    const tax = this.calculateTax(subtotal);
    
    // Step 9: Calculate final total
    const total = subtotal + tax;
    
    return {
      lineItems: allLineItems,
      baseFees: baseFees.total,
      staffCharges: staffCharges.total,
      extraCharges: extraCharges.total,
      subtotal,
      tax,
      total,
      calculatedAt: new Date().toISOString()
    };
  }
}

/**
 * Factory function to create calculator with loaded configs
 */
export async function createRateCalculator(): Promise<RateCalculator> {
  const configs = await getRateConfigs();
  return new RateCalculator(configs);
}
