using UnityEngine;

namespace Hex.MapGenerator;

public class EncounterCostCalculator : IPathfinderCostCalculator<int>
{
	private Vector2Int size;

	public int MaxCost => int.MaxValue;

	public int MinCost => 0;

	public void SetEncounter(EncounterTemplate template)
	{
		size = new Vector2Int(template.width, template.height);
	}

	public int CostToNeighbour(int currentCost, int current, int neighbour, int target)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(current, size);
		Vector2Int vector2Int2 = GridUtils.IndexToCoords(neighbour, size);
		int num = Mathf.Abs(vector2Int.x - vector2Int2.x);
		int num2 = Mathf.Abs(vector2Int.y - vector2Int2.y);
		int num3 = 10;
		if (num > 0 && num2 > 0)
		{
			num3 = 14;
		}
		return currentCost + num3;
	}
}
