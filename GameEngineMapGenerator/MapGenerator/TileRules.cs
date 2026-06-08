using UnityEngine;

namespace Hex.MapGenerator;

public class TileRules
{
	private readonly float[] distanceToBorderMap;

	private readonly Layout layout;

	private readonly Vector2Int mapSize;

	public TileRules(float[] distanceToBorderMap, Layout layout)
	{
		this.distanceToBorderMap = distanceToBorderMap;
		this.layout = layout;
		mapSize = layout.Size;
	}

	public bool NotOnZoneBorder(int position, Vector2Int tileSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(position, mapSize);
		for (int i = 0; i < tileSize.x; i++)
		{
			for (int j = 0; j < tileSize.y; j++)
			{
				int num = GridUtils.CoordsToIndex(vector2Int + new Vector2Int(i, j), mapSize);
				if (distanceToBorderMap[num] < 2f)
				{
					return false;
				}
			}
		}
		return true;
	}

	public bool NotOnMapBorder(int position, Vector2Int tileSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(position, mapSize);
		for (int i = 0; i < tileSize.x; i++)
		{
			for (int j = 0; j < tileSize.y; j++)
			{
				Vector2Int coords = vector2Int + new Vector2Int(i, j);
				if (!GridUtils.CheckBounds(coords, mapSize))
				{
					return false;
				}
				int tile = GridUtils.CoordsToIndex(coords, mapSize);
				if (!layout.GetPlayableZoneIdAt(tile).HasValue)
				{
					return false;
				}
			}
		}
		return true;
	}
}
