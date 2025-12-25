/**
 * Kalkulator wynagrodzeń - Polska specyfika
 * 
 * UWAGA: To jest uproszczona wersja kalkulatora. Wartości składek i progów podatkowych
 * należy regularnie aktualizować zgodnie z obowiązującymi przepisami prawa.
 * 
 * TODO: 
 * - Zweryfikować aktualne stawki składek ZUS (2025)
 * - Zweryfikować progi podatkowe i kwoty wolne od podatku
 * - Dodać obsługę ulg podatkowych (rodzinnych, rehabilitacyjnych, etc.)
 * - Rozważyć integrację z zewnętrznym API do aktualnych stawek
 */

// Stawki składek ZUS dla umowy o pracę (2024/2025 - DO WERYFIKACJI)
const ZUS_RATES = {
  // Składki pracownika (odliczane od brutto)
  employee: {
    pension: 0.0976,        // emerytalna
    disability: 0.015,      // rentowa
    sickness: 0.0245,       // chorobowa
    health: 0.09,           // zdrowotna (od podstawy po składkach społecznych)
  },
  // Składki pracodawcy (nie wpływają na netto pracownika)
  employer: {
    pension: 0.0976,
    disability: 0.065,
    accident: 0.0167,       // wypadkowa (zmienna, średnio ~1.67%)
    fp: 0.0245,             // Fundusz Pracy
    fgsp: 0.001,            // FGŚP
  }
};

// Koszty uzyskania przychodu (2024/2025 - DO WERYFIKACJI)
const TAX_DEDUCTIBLE_COSTS = {
  employment: {
    monthly: 250,           // miesięczne koszty dla umowy o pracę
    annual: 3000,           // roczne koszty
  },
  mandate: {
    rate: 0.20,             // 20% przychodów dla umowy zlecenie
    max_monthly: 2500,      // maksymalnie miesięcznie
  },
  contract: {
    rate: 0.20,             // 20% przychodów dla umowy o dzieło
  }
};

// Progi podatkowe (2024/2025 - DO WERYFIKACJI)
const TAX_RATES = {
  threshold: 120000,        // próg pierwszego przedziału (rocznie)
  rate1: 0.12,              // 12% do progu
  rate2: 0.32,              // 32% powyżej progu
  taxFreeAmount: 30000,     // kwota wolna od podatku (rocznie)
};

/**
 * Główna funkcja kalkulatora wynagrodzeń
 * 
 * @param {Object} params - Parametry obliczeń
 * @param {number} params.hourlyRate - Stawka godzinowa (PLN)
 * @param {number} params.baseHours - Liczba godzin podstawowych
 * @param {number} params.overtimeHours - Liczba nadgodzin
 * @param {number} params.overtimeMultiplier - Mnożnik nadgodzin (np. 1.5)
 * @param {number} params.bonus - Premia (PLN)
 * @param {string} params.contractType - Typ umowy: 'employment', 'mandate', 'contract'
 * @param {boolean} params.isStudent - Czy pracownik jest studentem < 26 lat
 * @param {boolean} params.hasDisability - Czy posiada orzeczenie o niepełnosprawności
 * @param {number} params.customCosts - Dodatkowe koszty uzyskania przychodu (PLN)
 * @param {number} params.taxDeduction - Dodatkowa ulga podatkowa (PLN)
 * 
 * @returns {Object} Wynik obliczeń z rozbiciem na składowe
 */
export function calculatePayroll(params) {
  const {
    hourlyRate = 0,
    baseHours = 0,
    overtimeHours = 0,
    overtimeMultiplier = 1.5,
    bonus = 0,
    contractType = 'employment',
    isStudent = false,
    hasDisability = false,
    customCosts = 0,
    taxDeduction = 0,
  } = params;

  // Oblicz wynagrodzenie brutto
  const basePay = hourlyRate * baseHours;
  const overtimePay = hourlyRate * overtimeHours * overtimeMultiplier;
  const gross = basePay + overtimePay + bonus;

  let result = {
    base: basePay.toFixed(2),
    overtime: overtimePay.toFixed(2),
    bonus: bonus.toFixed(2),
    gross: gross.toFixed(2),
    contributions: 0,
    taxBase: 0,
    tax: 0,
    net: 0,
    breakdown: {},
  };

  // Obliczenia zależne od typu umowy
  switch (contractType) {
    case 'employment':
      result = calculateEmploymentContract(gross, hasDisability, customCosts, taxDeduction, result);
      break;
    case 'mandate':
      result = calculateMandateContract(gross, isStudent, hasDisability, customCosts, taxDeduction, result);
      break;
    case 'contract':
      result = calculateWorkContract(gross, customCosts, taxDeduction, result);
      break;
    default:
      result = calculateEmploymentContract(gross, hasDisability, customCosts, taxDeduction, result);
  }

  return result;
}

/**
 * Obliczenia dla umowy o pracę
 * TODO: Zweryfikować aktualne stawki składek i progów
 */
function calculateEmploymentContract(gross, hasDisability, customCosts, taxDeduction, result) {
  // Składki społeczne pracownika
  const pensionContribution = gross * ZUS_RATES.employee.pension;
  const disabilityContribution = gross * ZUS_RATES.employee.disability;
  const sicknessContribution = gross * ZUS_RATES.employee.sickness;
  
  const socialContributions = pensionContribution + disabilityContribution + sicknessContribution;
  
  // Podstawa wymiaru składki zdrowotnej
  const healthBase = gross - socialContributions;
  const healthContribution = healthBase * ZUS_RATES.employee.health;
  
  // Łączne składki
  const totalContributions = socialContributions + healthContribution;
  
  // Koszty uzyskania przychodu
  const costs = TAX_DEDUCTIBLE_COSTS.employment.monthly + customCosts;
  
  // Podstawa opodatkowania
  const taxBase = Math.max(0, Math.round(healthBase - costs));
  
  // Podatek (uproszczony - zakładamy miesięczne rozliczenie)
  // TODO: Uwzględnić kwotę wolną od podatku w rozliczeniu rocznym
  let tax = Math.round(taxBase * TAX_RATES.rate1);
  
  // Odliczenie ulg
  tax = Math.max(0, tax - taxDeduction);
  
  // Składka zdrowotna do odliczenia od podatku (7.75% podstawy)
  const healthDeduction = Math.round(healthBase * 0.0775);
  tax = Math.max(0, tax - healthDeduction);
  
  // Wynagrodzenie netto
  const net = gross - totalContributions - tax;
  
  result.contributions = totalContributions.toFixed(2);
  result.taxBase = taxBase.toFixed(2);
  result.tax = tax.toFixed(2);
  result.net = net.toFixed(2);
  result.breakdown = {
    pensionContribution: pensionContribution.toFixed(2),
    disabilityContribution: disabilityContribution.toFixed(2),
    sicknessContribution: sicknessContribution.toFixed(2),
    healthContribution: healthContribution.toFixed(2),
    costs: costs.toFixed(2),
    healthDeduction: healthDeduction.toFixed(2),
  };
  
  return result;
}

/**
 * Obliczenia dla umowy zlecenie
 * TODO: Student < 26 lat - brak składek ZUS i podatku (do weryfikacji aktualnych przepisów)
 */
function calculateMandateContract(gross, isStudent, hasDisability, customCosts, taxDeduction, result) {
  let socialContributions = 0;
  let healthContribution = 0;
  
  // Student < 26 lat - zwolnienie ze składek i podatku
  if (isStudent) {
    // TODO: Zweryfikować aktualne przepisy dotyczące studentów
    // Obecnie (2024/2025) studenci < 26 lat są zwolnieni z ZUS i PIT
    result.contributions = '0.00';
    result.taxBase = '0.00';
    result.tax = '0.00';
    result.net = gross.toFixed(2);
    result.breakdown = {
      note: 'Student < 26 lat - zwolnienie ze składek ZUS i podatku PIT',
    };
    return result;
  }
  
  // Standardowa umowa zlecenie - składki jak dla umowy o pracę
  const pensionContribution = gross * ZUS_RATES.employee.pension;
  const disabilityContribution = gross * ZUS_RATES.employee.disability;
  const sicknessContribution = gross * ZUS_RATES.employee.sickness;
  
  socialContributions = pensionContribution + disabilityContribution + sicknessContribution;
  
  const healthBase = gross - socialContributions;
  healthContribution = healthBase * ZUS_RATES.employee.health;
  
  const totalContributions = socialContributions + healthContribution;
  
  // Koszty uzyskania przychodu - 20% przychodów, max 2500 PLN miesięcznie
  const costs = Math.min(gross * TAX_DEDUCTIBLE_COSTS.mandate.rate, TAX_DEDUCTIBLE_COSTS.mandate.max_monthly) + customCosts;
  
  const taxBase = Math.max(0, Math.round(healthBase - costs));
  let tax = Math.round(taxBase * TAX_RATES.rate1);
  tax = Math.max(0, tax - taxDeduction);
  
  const healthDeduction = Math.round(healthBase * 0.0775);
  tax = Math.max(0, tax - healthDeduction);
  
  const net = gross - totalContributions - tax;
  
  result.contributions = totalContributions.toFixed(2);
  result.taxBase = taxBase.toFixed(2);
  result.tax = tax.toFixed(2);
  result.net = net.toFixed(2);
  result.breakdown = {
    pensionContribution: pensionContribution.toFixed(2),
    disabilityContribution: disabilityContribution.toFixed(2),
    sicknessContribution: sicknessContribution.toFixed(2),
    healthContribution: healthContribution.toFixed(2),
    costs: costs.toFixed(2),
    healthDeduction: healthDeduction.toFixed(2),
  };
  
  return result;
}

/**
 * Obliczenia dla umowy o dzieło
 * TODO: Brak składek ZUS, tylko podatek (do weryfikacji)
 */
function calculateWorkContract(gross, customCosts, taxDeduction, result) {
  // Umowa o dzieło - brak składek ZUS
  // TODO: Zweryfikować aktualne przepisy dotyczące umów o dzieło
  
  // Koszty uzyskania przychodu - 20% przychodów
  const costs = (gross * TAX_DEDUCTIBLE_COSTS.contract.rate) + customCosts;
  
  const taxBase = Math.max(0, Math.round(gross - costs));
  let tax = Math.round(taxBase * TAX_RATES.rate1);
  tax = Math.max(0, tax - taxDeduction);
  
  const net = gross - tax;
  
  result.contributions = '0.00';
  result.taxBase = taxBase.toFixed(2);
  result.tax = tax.toFixed(2);
  result.net = net.toFixed(2);
  result.breakdown = {
    costs: costs.toFixed(2),
    note: 'Umowa o dzieło - brak składek ZUS',
  };
  
  return result;
}

/**
 * Funkcja pomocnicza do walidacji danych wejściowych
 */
export function validatePayrollInput(params) {
  const errors = [];
  
  if (!params.hourlyRate || params.hourlyRate <= 0) {
    errors.push('Stawka godzinowa musi być większa od 0');
  }
  
  if (params.baseHours < 0) {
    errors.push('Liczba godzin nie może być ujemna');
  }
  
  if (params.overtimeHours < 0) {
    errors.push('Liczba nadgodzin nie może być ujemna');
  }
  
  if (params.overtimeMultiplier < 1) {
    errors.push('Mnożnik nadgodzin musi być >= 1');
  }
  
  if (params.bonus < 0) {
    errors.push('Premia nie może być ujemna');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
