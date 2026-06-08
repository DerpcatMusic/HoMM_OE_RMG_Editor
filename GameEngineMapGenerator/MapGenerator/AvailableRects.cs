using UnityEngine;

namespace Hex.MapGenerator;

public class AvailableRects
{
	private Vector2Int[][] byDirection;

	private int maxFootprintDimension;

	public AvailableRects(int maxFootprintDimension)
	{
		this.maxFootprintDimension = maxFootprintDimension;
		byDirection = new Vector2Int[4][];
		for (int i = 0; i < 4; i++)
		{
			byDirection[i] = new Vector2Int[maxFootprintDimension];
		}
	}

	public void BuildAt(int index, ObstacleState[] obstacles, Vector2Int mapSize, int offsetFromBorder)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(index, mapSize);
		for (int i = 0; i < 4; i++)
		{
			Vector2Int vector2Int2 = Direction.FromIndex(i);
			Vector2Int vector2Int3 = ((i % 2 == 0) ? Vector2Int.right : Vector2Int.up);
			int num = int.MinValue;
			int num2 = int.MaxValue;
			for (int j = 0; j < maxFootprintDimension; j++)
			{
				Vector2Int vector2Int4 = vector2Int + (j + 1) * vector2Int2;
				for (int k = 0; k <= num2; k++)
				{
					Vector2Int coords = vector2Int4 + k * vector2Int3;
					if (!GridUtils.CheckBoundsWithOffset(coords, mapSize, offsetFromBorder) || !obstacles[GridUtils.CoordsToIndex(coords, mapSize)].IsFreeForEncounter())
					{
						num2 = k;
						break;
					}
				}
				for (int k = -1; k >= num; k--)
				{
					Vector2Int coords2 = vector2Int4 + k * vector2Int3;
					if (!GridUtils.CheckBoundsWithOffset(coords2, mapSize, offsetFromBorder) || !obstacles[GridUtils.CoordsToIndex(coords2, mapSize)].IsFreeForEncounter())
					{
						num = k + 1;
						break;
					}
				}
				byDirection[i][j] = new Vector2Int(num, num2);
			}
		}
	}

	public bool DoesFootprintFit(Footprint footprint)
	{
		Vector2Int lookupIndices = footprint.lookupIndices;
		Vector2Int fitMinMax = footprint.fitMinMax;
		Vector2Int vector2Int = byDirection[lookupIndices.x][lookupIndices.y];
		if (fitMinMax.x >= vector2Int.x)
		{
			return fitMinMax.y <= vector2Int.y;
		}
		return false;
	}
}
