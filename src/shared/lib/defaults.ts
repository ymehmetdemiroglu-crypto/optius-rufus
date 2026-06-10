import type {
  SimulatorScenario,
  TransformSnippet,
  FreeQAItem,
  ReviewSentimentProfile,
  CompetitorComparison,
  PPCKeywordItem,
  BundlingItem,
  CosmoNodeData,
} from '../dtos/prospect.dto';

export function getDefaultSimulatorScenarios(): SimulatorScenario[] {
  return [
    {
      buyerQuestion: `Is this product safe to use daily?`,
      rufusAnswer: `Based on available information, I cannot determine daily usage safety. Here are products with detailed safety info:`,
      competitorName: 'Category Leader',
      failReason: 'No daily usage or safety information in your listing.',
    },
    {
      buyerQuestion: `When is the best time to use this?`,
      rufusAnswer: `This listing doesn't specify optimal timing. However, other products recommend specific timing:`,
      competitorName: 'Category Leader',
      failReason: 'Missing usage timing and routine integration details.',
    },
    {
      buyerQuestion: `How does this compare to alternatives?`,
      rufusAnswer: `I don't have enough differentiation data. Here are products with comparison info:`,
      competitorName: 'Category Leader',
      failReason: 'No competitive differentiation or unique value details.',
    },
  ];
}

export function getDefaultTransformBefore(title: string, bullets: string[]): TransformSnippet[] {
  return [
    { section: 'Title', content: title || 'Current title' },
    { section: 'Bullet 1', content: bullets[0] || 'Current bullet point' },
    { section: 'Bullet 2', content: bullets[1] || 'Current bullet point' },
  ];
}

export function getDefaultTransformAfter(): TransformSnippet[] {
  return [
    { section: 'Title', content: 'Optimized title with semantic coverage' },
    { section: 'Bullet 1', content: 'Optimized bullet addressing top buyer questions' },
    { section: 'Bullet 2', content: 'Optimized bullet with usage timing and safety' },
  ];
}

export function getDefaultFreeQAs(category: string): FreeQAItem[] {
  return [
    {
      question: `Is this ${category.toLowerCase() || 'product'} safe for daily use?`,
      answer: `Yes! Our organic supergreens powder is formulated for daily cellular vitality and nutrient support. Take one scoop daily in water or your favorite smoothie.`,
      dimension: 'daily_usage_safety',
    },
    {
      question: `Does this contain any artificial sweeteners or gluten?`,
      answer: `No. It is 100% USDA Organic, Vegan, and Gluten-Free. There are zero artificial ingredients, soy, dairy, or binders.`,
      dimension: 'ingredient_purity',
    },
    {
      question: `When is the best time of day to consume this?`,
      answer: `We recommend drinking it in the morning on an empty stomach for maximum nutrient absorption and sustained energy throughout the day.`,
      dimension: 'usage_timing',
    },
  ];
}

export function getDefaultReviewSentiment(): ReviewSentimentProfile[] {
  return [
    {
      aspect: 'Mixing & Solubility',
      status: 'good',
      feedback: '82% of reviews mention it dissolves easily without clumping compared to industry averages.',
      percentage: 82,
    },
    {
      aspect: 'Taste & Texture',
      status: 'warning',
      feedback: '14% of buyers note an earthy/chalky taste. Rufus may advise buyers seeking sweet options to look elsewhere.',
      percentage: 14,
    },
    {
      aspect: 'Energy Levels',
      status: 'good',
      feedback: '94% of buyers report sustained morning energy levels within a week of consistent daily use.',
      percentage: 94,
    },
    {
      aspect: 'Packaging Seal',
      status: 'critical',
      feedback: '9% of buyers report defects with the zip-lock bag sealing. Rufus actively flags packaging reliability concerns.',
      percentage: 9,
    },
  ];
}

export function getDefaultCompetitorAudit(category: string): CompetitorComparison[] {
  return [
    {
      query: `Best organic ${category.toLowerCase() || 'product'} with prebiotics for bloating`,
      competitorName: 'Greens Champion Plus',
      competitorAdvantage: 'Explicitly lists clinical prebiotic strains (Inulin) and digestive enzymes in its bullet points and Q&A.',
      yourGap: 'Your listing mentions "prebiotics" but fails to specify the source or explain why it reduces bloating.',
    },
    {
      query: `Gluten-free daily ${category.toLowerCase() || 'greens'} for morning energy`,
      competitorName: 'Organifi Pure Greens',
      competitorAdvantage: 'Highlights "morning ritual integration" and "GFCO Certified gluten-free" labels in its top images and title.',
      yourGap: 'Your gluten-free claim is buried at the end of the third bullet point, which Rufus ranks as low relevance.',
    },
  ];
}

export function getDefaultPpcKeywords(category: string): PPCKeywordItem[] {
  return [
    { intent: 'Digestive Health', keyword: `organic ${category.toLowerCase() || 'greens'} powder for bloating`, difficulty: 'Low', searchVolume: 1240, bidEstimate: 1.25 },
    { intent: 'Daily Vitality', keyword: `daily USDA organic ${category.toLowerCase() || 'greens'} powder`, difficulty: 'Medium', searchVolume: 4200, bidEstimate: 2.10 },
    { intent: 'Dietary Purity', keyword: `gluten free vegan ${category.toLowerCase() || 'supergreens'} drink`, difficulty: 'Low', searchVolume: 850, bidEstimate: 0.95 },
    { intent: 'Energy Support', keyword: `morning energy ${category.toLowerCase() || 'greens'} powder drink`, difficulty: 'Medium', searchVolume: 1800, bidEstimate: 1.65 },
  ];
}

export function getDefaultCosmoBundling(brand: string): BundlingItem[] {
  return [
    {
      title: 'The Morning Synergy Bundle',
      products: [`${brand || 'Acme'} Supergreens Powder`, `${brand || 'Acme'} Organic Apple Cider Vinegar Capsules`],
      rationale: 'COSMO purchase history graphs show a strong co-purchase correlation for gut-health boosters in the morning. Bundling these forces a direct relationship path.',
    },
    {
      title: 'Ultimate Daily Vitality Pack',
      products: [`${brand || 'Acme'} Supergreens Powder`, `${brand || 'Acme'} Vegan Vitamin D3 + K2 Drops`],
      rationale: 'Sellers purchasing daily plant-based nutrients frequently add fat-soluble vitamin droplets. Combines immunity and gut health.',
    },
  ];
}

export function getDefaultCosmoGraphData(brand: string): CosmoNodeData {
  return {
    nodes: [
      { id: '1', label: brand || 'Your Brand', group: 'core' },
      { id: '2', label: 'USDA Organic', group: 'connected' },
      { id: '3', label: 'Vegan Gut Health', group: 'connected' },
      { id: '4', label: 'Daily Vitality', group: 'connected' },
      { id: '5', label: 'Bloating Relief', group: 'gap' },
      { id: '6', label: 'Daily Dosage Safety', group: 'gap' },
      { id: '7', label: 'Morning Energy Boost', group: 'gap' },
    ],
    edges: [
      { from: '1', to: '2', active: true },
      { from: '1', to: '3', active: true },
      { from: '1', to: '4', active: true },
      { from: '1', to: '5', active: false },
      { from: '1', to: '6', active: false },
      { from: '1', to: '7', active: false },
    ],
  };
}
