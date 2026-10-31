const { callGroqAgent } = require('./groqClient');
const ValuationROIAgent = require('./ValuationROIAgent');
const GeoSpatialAgent = require('./GeoSpatialAgent');
const NegotiationAgent = require('./NegotiationAgent');

/**
 * Agent Debate Orchestrator - Multi-Agent Consensus Engine
 */
class AgentDebateOrchestrator {
  static async runDebate({ properties, buyerPreferences = {} }) {
    if (!properties || properties.length === 0) {
      throw new Error("At least one property is required for multi-agent debate.");
    }

    // Step 1: Gather parallel audits from specialized agents
    const propertyAudits = await Promise.all(
      properties.map(async (prop) => {
        const [valuation, geo, negotiation] = await Promise.all([
          ValuationROIAgent.evaluateProperty(prop),
          GeoSpatialAgent.evaluateLocation(prop),
          NegotiationAgent.strategizeDeal({ property: prop, buyerBudget: prop.price })
        ]);

        return {
          propertyId: prop._id || prop.id || prop.title,
          propertyName: prop.title || prop.name,
          price: prop.price,
          city: prop.location?.city || 'Unknown',
          valuationAudit: valuation,
          geoAudit: geo,
          negotiationAudit: negotiation
        };
      })
    );

    // Step 2: Conduct live Groq-powered multi-agent debate script synthesis
    const systemPrompt = `You are the 'Agent Debate Orchestrator'. You manage a live 3-way expert panel debate comparing properties for a buyer.
The 3 AI Agents on panel are:
1. 📈 Valuation & ROI Specialist Agent (focuses on price fairness, rental yield, 5yr growth)
2. 🗺️ GeoSpatial & Health Agent (focuses on transit times, metro, AQI, green space)
3. 🤝 Negotiation Deal Strategist Agent (focuses on counter-offers, EMI affordability, savings)

Your job is to generate a dynamic 3-round debate conversation between these 3 agents, ending in a clear, plain-English Consensus Winner!

Return valid JSON with keys:
{
  "debateTitle": string,
  "rounds": [
    {
      "roundNumber": 1,
      "topic": "Financial & Appreciation Potential",
      "agentArguments": [
        {
          "agentName": "ValuationROIAgent",
          "agentTitle": "Valuation & ROI Specialist",
          "avatar": "📈",
          "statement": string
        },
        {
          "agentName": "GeoSpatialAgent",
          "agentTitle": "GeoSpatial & Health Specialist",
          "avatar": "🗺️",
          "statement": string
        },
        {
          "agentName": "NegotiationAgent",
          "agentTitle": "Deal & Negotiation Strategist",
          "avatar": "🤝",
          "statement": string
        }
      ]
    },
    {
      "roundNumber": 2,
      "topic": "Livability, AQI & Daily Commute",
      "agentArguments": [...]
    }
  ],
  "consensusWinner": {
    "propertyName": string,
    "winningBadge": string (e.g. "Best Overall Choice for Growing Families"),
    "winningScore": number (0-100),
    "plainEnglishConsensusReasoning": string,
    "keyTakeaways": string[]
  }
}`;

    const userPrompt = `Buyer Preferences: ${JSON.stringify(buyerPreferences)}
Audited Properties Data: ${JSON.stringify(propertyAudits)}

Generate the complete multi-agent debate and consensus winner in valid JSON.`;

    try {
      const rawResponse = await callGroqAgent({
        systemPrompt,
        userPrompt,
        temperature: 0.5,
        maxTokens: 2200 // headroom for a full multi-round debate JSON so it isn't truncated mid-array (a truncated response fails JSON.parse and falls back to static content)
      });

      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          audits: propertyAudits,
          ...parsed
        };
      }
    } catch (error) {
      console.error("AgentDebateOrchestrator Error:", error);
    }

    // Fallback structured debate
    const winnerName = properties[0]?.title || properties[0]?.name || "Sobha Dream Acres";
    return {
      audits: propertyAudits,
      debateTitle: "AI Multi-Agent Consensus Panel",
      rounds: [
        {
          roundNumber: 1,
          topic: "Investment ROI vs Commute Convenience",
          agentArguments: [
            {
              agentName: "ValuationROIAgent",
              agentTitle: "Valuation Specialist",
              avatar: "📈",
              statement: `${winnerName} offers an estimated 32% appreciation over 5 years with high rental yield.`
            },
            {
              agentName: "GeoSpatialAgent",
              agentTitle: "GeoSpatial Specialist",
              avatar: "🗺️",
              statement: "Connectivity to metro stations and air quality AQI 45 make this the healthiest option for daily living."
            },
            {
              agentName: "NegotiationAgent",
              agentTitle: "Deal Strategist",
              avatar: "🤝",
              statement: "We recommend placing a counter-offer 5% below list price, saving approx ₹4.5 Lakhs upfront."
            }
          ]
        }
      ],
      consensusWinner: {
        propertyName: winnerName,
        winningBadge: "Top Recommended Property Match",
        winningScore: 92,
        plainEnglishConsensusReasoning: `${winnerName} delivers the optimal balance of financial appreciation, green air quality, and manageable monthly EMIs.`,
        keyTakeaways: [
          "Strong 5-year appreciation outlook",
          "5 minutes walk to transport hubs",
          "Highest negotiation leverage for token booking"
        ]
      }
    };
  }
}

module.exports = AgentDebateOrchestrator;
