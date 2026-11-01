const { callGroqAgent } = require('./groqClient');

const toLakhs = (amount) => `₹${(amount / 100000).toFixed(2)} Lakhs`;

const monthlyEmi = (loanAmount, annualRatePct, tenureYears) => {
  const r = annualRatePct / 12 / 100;
  const n = tenureYears * 12;
  return Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
};

// Used when the LLM is unavailable or returns unparseable output. Every number
// is computed from this property's real price and loan terms — no canned
// figures that would be identical (and wrong) for every property.
const computedFallback = ({ propertyPrice, downPaymentPct, tenureYears, interestRate, closingAdvice }) => {
  const counterOffer = Math.round(propertyPrice * 0.95);
  const downPayment = Math.round(counterOffer * (downPaymentPct / 100));
  const emi = monthlyEmi(counterOffer - downPayment, interestRate, tenureYears);
  return {
    listPrice: propertyPrice,
    recommendedCounterOffer: counterOffer,
    estimatedSavingsAmount: toLakhs(propertyPrice - counterOffer),
    estimatedEMI: `₹${emi.toLocaleString('en-IN')}/mo`,
    recommendedDownPayment: `${toLakhs(downPayment)} (${downPaymentPct}%)`,
    loanTenureYears: tenureYears,
    taxSavingsPerYear: 'Up to ₹2,00,000/yr home-loan interest deduction under Section 24(b) (old tax regime, self-occupied home)',
    negotiationTactics: [
      'Open around 5% below the asking price and justify it with recent sale prices of comparable flats in the same locality.',
      'Offer a quick token payment or a pre-approved home loan in exchange for a lower price.',
      'Ask for parking, club membership or registration charges to be included if the price will not move.',
    ],
    closingAdvice,
  };
};

/**
 * Negotiation & EMI Deal Strategist Agent
 */
class NegotiationAgent {
  static async strategizeDeal({ property, buyerBudget, downPaymentPct = 20, tenureYears = 20, interestRate = 8.5 }) {
    const propertyPrice = property.price || 9500000;
    const fallbackArgs = { propertyPrice, downPaymentPct, tenureYears, interestRate };

    const systemPrompt = `You are 'Negotiation & EMI Deal Strategist Agent', an autonomous real estate deal advisor representing the buyer.
Your objective is to:
1. Formulate a strong, data-backed counter-offer to save the buyer money.
2. Provide step-by-step negotiation scripts/tactics for the buyer to use with the developer/seller.
3. Calculate exact loan EMI breakdown and tax savings under Section 24 & 80EEA.
4. Summarize potential savings in plain English.

Return valid JSON with keys:
{
  "listPrice": number,
  "recommendedCounterOffer": number,
  "estimatedSavingsAmount": string (e.g. "₹4.5 Lakhs"),
  "estimatedEMI": string (e.g. "₹65,800/mo"),
  "recommendedDownPayment": string,
  "loanTenureYears": number,
  "taxSavingsPerYear": string (e.g. "₹75,000/yr"),
  "negotiationTactics": string[] (3 actionable tactics for the buyer),
  "closingAdvice": string (Plain-English final recommendation)
}`;

    const userPrompt = `Property Name: ${property.title || property.name}
Property Price: ₹${propertyPrice}
Buyer Budget: ₹${buyerBudget || propertyPrice}
Down Payment: ${downPaymentPct}%
Loan Interest Rate: ${interestRate}%
Tenure: ${tenureYears} Years

Formulate the negotiation strategy and return valid JSON.`;

    try {
      const rawResponse = await callGroqAgent({
        systemPrompt,
        userPrompt,
        temperature: 0.4,
        maxTokens: 900
      });

      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return computedFallback({ ...fallbackArgs, closingAdvice: rawResponse });
    } catch (error) {
      console.error("NegotiationAgent Error:", error);
      return computedFallback({
        ...fallbackArgs,
        closingAdvice: `The AI strategist is unavailable right now, so these figures are a standard calculation: a counter-offer about 5% below the ${toLakhs(propertyPrice)} asking price, with EMI computed at ${interestRate}% over ${tenureYears} years.`,
      });
    }
  }
}

module.exports = NegotiationAgent;
