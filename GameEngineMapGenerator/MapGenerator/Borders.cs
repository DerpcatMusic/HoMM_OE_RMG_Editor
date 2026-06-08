using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public static class Borders
{
	private static ProfilerMarker ProfilerMarker = new ProfilerMarker("PlaceBorders");

	public static void PlaceBorders(out ObstacleState[] obstaclesMap, out int[] subzoneMap, out int subzoneCount, Vector2Int mapSize, ZoneMap zoneMap, ReadOnlyArray<sbyte> elevationMap)
	{
		obstaclesMap = MakeBorders(mapSize, zoneMap, elevationMap);
		(subzoneMap, subzoneCount) = FindSubzones(obstaclesMap, mapSize, zoneMap, elevationMap);
	}

	private static ObstacleState[] MakeBorders(Vector2Int mapSize, ZoneMap zoneMap, ReadOnlyArray<sbyte> elevation)
	{
		ObstacleState[] array = new ObstacleState[zoneMap.Length];
		for (int i = 0; i < zoneMap.Length; i++)
		{
			byte? b = zoneMap[i];
			if (!b.HasValue)
			{
				array[i] = ObstacleState.Obstacle;
				continue;
			}
			int num = elevation[i];
			ObstacleState obstacleState = ObstacleState.Free;
			bool flag = false;
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(i, mapSize, skipOutOfBounds: false).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				flag = !flag;
				if (current >= 0)
				{
					byte? b2 = zoneMap[current];
					int num2 = elevation[current];
					if (num < num2)
					{
						obstacleState = ObstacleState.Cliff;
						break;
					}
					if (num == num2 && flag && b.HasValue && b2.HasValue && b != b2)
					{
						obstacleState = ObstacleState.Border;
					}
				}
			}
			array[i] = obstacleState;
		}
		return array;
	}

	private static (int[], int) FindSubzones(ObstacleState[] obstacles, Vector2Int mapSize, ZoneMap zoneMap, ReadOnlyArray<sbyte> elevationMap)
	{
		FloodFiller floodFiller = new FloodFiller(mapSize);
		MapFilterValue<bool> filter = new MapFilterValue<bool>((int tile) => zoneMap[tile].HasValue, value: true);
		MapFilterValue<byte> filter2 = new MapFilterValue<byte>((int tile) => zoneMap.GetPlayableZoneRaw(tile), 0);
		MapFilterValue<sbyte> filter3 = new MapFilterValue<sbyte>((int tile) => elevationMap[tile], 0);
		MapFilterCondition filter4 = new MapFilterCondition((int index) => obstacles[index].IsWalkable());
		floodFiller.AttachFilter(filter);
		floodFiller.AttachFilter(filter2, addBorder: false, grabValueOnStart: true);
		floodFiller.AttachFilter(filter3, addBorder: false, grabValueOnStart: true);
		floodFiller.AttachFilter(filter4, addBorder: true);
		var (item, array) = floodFiller.FindAllContinuousAreas(Neighbourhood.All, 100);
		return (item, array.Length);
	}
}
