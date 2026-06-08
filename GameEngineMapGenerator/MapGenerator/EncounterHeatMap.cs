using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class EncounterHeatMap
{
	private Vector2Int mapSize;

	private float[] values;

	private List<float> weights;

	public float[] Values => values;

	public EncounterHeatMap(Vector2Int mapSize)
	{
		this.mapSize = mapSize;
		values = new float[mapSize.x * mapSize.y];
		weights = new List<float>();
	}

	public void WriteEncounter(Encounter encounter)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, mapSize);
		for (int i = -1; i < encounter.template.width + 1; i++)
		{
			for (int j = -1; j <= encounter.template.height + 1; j++)
			{
				Vector2Int coords = vector2Int + new Vector2Int(i, j);
				if (GridUtils.CheckBounds(coords, mapSize))
				{
					int num = GridUtils.CoordsToIndex(coords, mapSize);
					values[num] += 1f;
				}
			}
		}
	}

	public void SortPoints(WalkablePoints points, System.Random random)
	{
		List<int> lookupOrder = points.LookupOrder;
		lookupOrder.Clear();
		weights.Clear();
		for (int i = 0; i < points.TileCount; i++)
		{
			int num = points.Tiles[i];
			float num2 = (float)random.NextDouble() * 0.01f;
			num2 += values[num];
			weights.Add(num2);
			lookupOrder.Add(i);
		}
		lookupOrder.Sort((int a, int b) => weights[a].CompareTo(weights[b]));
	}
}
