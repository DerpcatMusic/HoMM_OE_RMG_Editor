using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class PickupHeatMap
{
	private const int Radius = 3;

	private Vector2Int mapSize;

	private MapDescription mapDesc;

	private int tileCount;

	private System.Random random;

	private ReadOnlyArray<ObstacleState> obstaclesMap;

	private ZoneMap zoneMap;

	private ReadOnlyArray<sbyte> elevationMap;

	private ReadOnlyArray<byte> roadMap;

	private float[] values;

	private bool[] blocked;

	private List<int>[] freeTilesOfZone;

	public PickupHeatMap(ReadOnlyArray<ObstacleState> obstaclesMap, ZoneMap zoneMap, ReadOnlyArray<sbyte> elevationMap, ReadOnlyArray<byte> roadMap, MapDescription mapDesc, int zoneCount, System.Random random, Vector2Int mapSize)
	{
		this.mapSize = mapSize;
		this.random = random;
		this.mapDesc = mapDesc;
		this.obstaclesMap = obstaclesMap;
		this.zoneMap = zoneMap;
		this.elevationMap = elevationMap;
		this.roadMap = roadMap;
		tileCount = mapSize.x * mapSize.y;
		values = new float[tileCount];
		blocked = new bool[tileCount];
		freeTilesOfZone = new List<int>[zoneCount];
		for (int i = 0; i < zoneCount; i++)
		{
			freeTilesOfZone[i] = new List<int>(100);
		}
		for (int j = 0; j < tileCount; j++)
		{
			byte? b = zoneMap[j];
			if (b.HasValue && obstaclesMap[j].IsFreeForEncounter())
			{
				freeTilesOfZone[b.Value].Add(j);
			}
		}
		for (int k = 0; k < zoneCount; k++)
		{
			RngUtils.Shuffle(freeTilesOfZone[k], random);
		}
		InitializeValues();
	}

	public int GetTileWithLowestInterest(int zoneID)
	{
		float num = float.MaxValue;
		int result = -1;
		List<int> list = freeTilesOfZone[zoneID];
		for (int i = 0; i < list.Count; i++)
		{
			int num2 = list[i];
			if (!blocked[num2] && values[num2] < num)
			{
				num = values[num2];
				result = num2;
			}
		}
		return result;
	}

	public void AddPickup(int zoneID, int tile)
	{
		float repulsion = mapDesc.zones[zoneID].layout.ambientPickupDistribution.repulsion;
		AddInterestInRadius(zoneID, tile, repulsion, 3f);
		BlockTile(tile);
	}

	public void AddInterestInRadius(int zoneID, int tile, float value, float radius)
	{
		int num = Mathf.CeilToInt(radius);
		sbyte b = elevationMap[tile];
		Vector2Int vector2Int = GridUtils.IndexToCoords(tile, mapSize);
		for (int i = -num; i <= num; i++)
		{
			for (int j = -num; j <= num; j++)
			{
				Vector2Int vector2Int2 = vector2Int + new Vector2Int(i, j);
				if (GridUtils.CheckBounds(vector2Int2, mapSize))
				{
					int num2 = GridUtils.CoordsToIndex(vector2Int2, mapSize);
					if (zoneMap[num2] == zoneID && elevationMap[num2] == b)
					{
						float magnitude = (vector2Int2 - vector2Int).magnitude;
						values[num2] += value * BrushProfile(magnitude, radius);
					}
				}
			}
		}
	}

	public void BlockTile(int tile)
	{
		blocked[tile] = true;
	}

	private void InitializeValues()
	{
		int num = 3;
		for (int i = 0; i < tileCount; i++)
		{
			byte? b = zoneMap[i];
			if (!obstaclesMap[i].IsFreeForEncounter() || !b.HasValue)
			{
				values[i] = float.MaxValue;
				continue;
			}
			sbyte b2 = elevationMap[i];
			float num2 = float.MaxValue;
			float num3 = float.MaxValue;
			bool flag = false;
			bool flag2 = false;
			Vector2Int vector2Int = GridUtils.IndexToCoords(i, mapSize);
			for (int j = -num; j <= num; j++)
			{
				for (int k = -num; k <= num; k++)
				{
					Vector2Int vector2Int2 = vector2Int + new Vector2Int(j, k);
					if (!GridUtils.CheckBounds(vector2Int2, mapSize))
					{
						continue;
					}
					int num4 = GridUtils.CoordsToIndex(vector2Int2, mapSize);
					if (zoneMap[num4] == b && elevationMap[num4] == b2)
					{
						int sqrMagnitude = (vector2Int2 - vector2Int).sqrMagnitude;
						if (obstaclesMap[num4].IsObstacle() && (float)sqrMagnitude < num2)
						{
							num2 = sqrMagnitude;
							flag = true;
						}
						if (roadMap[num4] > 0 && (float)sqrMagnitude < num3)
						{
							num3 = sqrMagnitude;
							flag2 = true;
						}
					}
				}
			}
			num2 = Mathf.Sqrt(num2);
			num3 = Mathf.Sqrt(num3);
			AmbientPickupDistribution ambientPickupDistribution = mapDesc.zones[b.Value].layout.ambientPickupDistribution;
			float num5 = (float)(random.NextDouble() - 0.5) * ambientPickupDistribution.noise;
			if (flag)
			{
				num5 += (0f - ambientPickupDistribution.obstacleAttraction) * BrushProfile(num2, 3f);
			}
			if (flag2)
			{
				num5 += (0f - ambientPickupDistribution.roadAttraction) * BrushProfile(num3, 3f);
			}
			values[i] = num5;
		}
	}

	private float BrushProfile(float distance, float radius)
	{
		return Mathf.Lerp(1f, 0f, distance / radius);
	}
}
