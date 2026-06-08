using System;
using System.Collections.Generic;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public static class Obstacles
{
	private static ProfilerMarker ProfilerMarker = new ProfilerMarker("FillObstacles");

	private const int BorderFillPercent = 80;

	public static void Fill(ObstacleState[] obstacles, ZoneMap zoneMap, MapDescription mapDesc, EncounterHeatMap heatMap, System.Random random, Vector2Int mapSize)
	{
		FillRandom(obstacles, zoneMap, heatMap, mapDesc, random, mapSize);
		FillRandomNearBorder(obstacles, mapDesc, random, mapSize);
		CellularAutomata(4, obstacles, mapSize);
		FillUnreachable(obstacles, mapSize);
	}

	public static void FillUnreachable(ObstacleState[] obstacles, Vector2Int mapSize)
	{
		FloodFiller floodFiller = new FloodFiller(mapSize);
		MapFilterCondition filter = new MapFilterCondition((int tile) => obstacles[tile].IsWalkable());
		floodFiller.AttachFilter(filter);
		bool[] array = new bool[mapSize.x * mapSize.y];
		List<int> list = new List<int>();
		for (int num = 0; num < mapSize.x * mapSize.y; num++)
		{
			if (array[num] || obstacles[num] != ObstacleState.AlwaysFree)
			{
				continue;
			}
			list.Clear();
			floodFiller.SetOutList(list);
			floodFiller.FloodFill(num, Neighbourhood.All);
			foreach (int item in list)
			{
				array[item] = true;
			}
		}
		for (int num2 = 0; num2 < mapSize.x * mapSize.y; num2++)
		{
			if (!array[num2] && obstacles[num2].IsFreeForObstacles())
			{
				obstacles[num2] = ObstacleState.Obstacle;
			}
		}
	}

	private static void FillRandom(ObstacleState[] obstacles, ZoneMap zoneMap, EncounterHeatMap heatMap, MapDescription mapDesc, System.Random random, Vector2Int mapSize)
	{
		int[] array = new int[mapDesc.zones.Count];
		int[] array2 = new int[mapDesc.zones.Count];
		for (int i = 0; i < array.Length; i++)
		{
			array[i] = Mathf.RoundToInt(Mathf.Clamp01(mapDesc.zones[i].layout.obstaclesFill) * 100f);
			array2[i] = Mathf.RoundToInt(Mathf.Clamp01(mapDesc.zones[i].layout.obstaclesFillVoid) * 100f);
		}
		for (int j = 0; j < mapSize.x * mapSize.y; j++)
		{
			bool flag = obstacles[j].IsFreeForObstacles();
			byte? b = zoneMap[j];
			if (b.HasValue)
			{
				int num = array[b.Value];
				if (heatMap.Values[j] == 0f)
				{
					num = array2[b.Value];
				}
				if (flag && random.Next(100) <= num)
				{
					obstacles[j] = ObstacleState.Obstacle;
				}
			}
		}
	}

	private static void FillRandomNearBorder(ObstacleState[] obstacles, MapDescription mapDesc, System.Random random, Vector2Int mapSize)
	{
		for (int i = 0; i < mapSize.x * mapSize.y; i++)
		{
			float num = MapShape.DistanceToBorder(GridUtils.IndexToCoords(i, mapSize), mapSize, mapDesc, waterOnly: false);
			if (num <= 0f)
			{
				continue;
			}
			obstacles[i] = ObstacleState.Free;
			if (num < 3f)
			{
				if (random.Next(100) <= 80)
				{
					obstacles[i] = ObstacleState.Obstacle;
				}
			}
			else
			{
				obstacles[i] = ObstacleState.Obstacle;
			}
		}
	}

	private static void CellularAutomata(int threshold, ObstacleState[] obstacles, Vector2Int mapSize)
	{
		ObstacleState[] array = Utils.CopyArray(obstacles);
		for (int i = 0; i < mapSize.x * mapSize.y; i++)
		{
			if (!array[i].IsFreeForObstacles() && array[i] != ObstacleState.Obstacle)
			{
				continue;
			}
			bool flag = false;
			int num = 0;
			int num2 = 0;
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(i, mapSize, skipOutOfBounds: false).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				flag = !flag;
				if (current == -1)
				{
					num++;
					continue;
				}
				ObstacleState obstacleState = array[current];
				switch (obstacleState)
				{
				case ObstacleState.Border:
					num++;
					break;
				case ObstacleState.Cliff:
					num++;
					break;
				case ObstacleState.Obstacle:
					num++;
					break;
				case ObstacleState.AlwaysObstacle:
					num++;
					break;
				}
				if (obstacleState == ObstacleState.AlwaysFree && flag)
				{
					num2++;
				}
			}
			if (num > threshold)
			{
				obstacles[i] = ObstacleState.Obstacle;
			}
			if (num < threshold)
			{
				obstacles[i] = ObstacleState.Free;
			}
			if (num2 >= 2)
			{
				obstacles[i] = ObstacleState.Free;
			}
		}
	}
}
