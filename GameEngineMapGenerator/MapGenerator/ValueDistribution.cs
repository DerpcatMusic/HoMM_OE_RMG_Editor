using UnityEngine;

namespace Hex.MapGenerator;

public class ValueDistribution
{
	private float[] percentages;

	private Vector2Int[] brackets;

	public float[] TargetPercentages => percentages;

	public Vector2Int[] Brackets => brackets;

	public int BracketCount => brackets.Length;

	public Vector2Int Bracket(int bracketIndex)
	{
		return brackets[bracketIndex];
	}

	public int GetBracketForValue(int value)
	{
		for (int i = 0; i < brackets.Length; i++)
		{
			if (Utils.IsInValueBracket(value, brackets[i].x, brackets[i].y))
			{
				return i;
			}
		}
		return -1;
	}

	public ValueDistribution(ValueDistributionConfig config, string contentPool)
	{
		int num = config.weights.Length;
		percentages = new float[num];
		brackets = new Vector2Int[num];
		if (config.priceBounds.Length + 1 != brackets.Length)
		{
			throw new GeneratorException("Ivalid bracket count for value distribution in content pool '" + contentPool + "'", Log.Context.none);
		}
		float num2 = 0f;
		for (int i = 0; i < num; i++)
		{
			int num3 = ((i != 0) ? config.priceBounds[i - 1] : 0);
			int num4 = ((i == num - 1) ? (-1) : config.priceBounds[i]);
			if (num4 < num3 && num4 != -1)
			{
				throw new GeneratorException("Invalid price bounds for value distribution in content pool '" + contentPool + "'", Log.Context.none);
			}
			brackets[i] = new Vector2Int(num3, num4);
			num2 += config.weights[i];
		}
		for (int j = 0; j < num; j++)
		{
			percentages[j] = config.weights[j] / num2;
		}
	}
}
