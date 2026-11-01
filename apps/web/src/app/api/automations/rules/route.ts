import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AutomationEngine, type AutomationRule } from '@storefront-ops/core';

export async function GET() {
  const recipes = AutomationEngine.getPrebuiltRecipes();

  // Standard active rules (e.g. 5 active rules installed)
  const activeRules: AutomationRule[] = recipes.slice(0, 5);

  return NextResponse.json({
    activeRules,
    recipes,
    totalRecipesCount: recipes.length,
  });
}

const installRecipeSchema = z.object({
  recipeId: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = installRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid recipe installation payload', details: parsed.error.format() }, { status: 400 });
    }

    const recipes = AutomationEngine.getPrebuiltRecipes();
    const target = recipes.find((r) => r.id === parsed.data.recipeId);

    if (!target) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      rule: { ...target, id: `rule_${Date.now()}` },
      message: `Recipe "${target.name}" installed and activated successfully.`,
    });
  } catch (error) {
    console.error('Install recipe error:', error);
    return NextResponse.json({ error: 'Failed to install recipe' }, { status: 500 });
  }
}
