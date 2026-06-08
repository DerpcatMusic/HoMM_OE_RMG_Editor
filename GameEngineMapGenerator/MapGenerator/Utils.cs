using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public static class Utils
{
	public const byte NullZoneID = byte.MaxValue;

	public const int NullID = -1;

	public static Vector2Int Order(int a, int b)
	{
		if (a >= b)
		{
			return new Vector2Int(b, a);
		}
		return new Vector2Int(a, b);
	}

	public static Vector2Int Order(Vector2Int v)
	{
		return Order(v.x, v.y);
	}

	public static int FindNearby(Vector2Int centerCoords, Vector2Int size, IMapFilter filter, int radius)
	{
		float distance;
		return FindNearby(out distance, centerCoords, size, filter, radius);
	}

	public static int FindNearby(int centerIndex, Vector2Int size, IMapFilter filter, int radius)
	{
		return FindNearby(GridUtils.IndexToCoords(centerIndex, size), size, filter, radius);
	}

	public static int FindNearby(Vector2 centerPosition, Vector2Int size, IMapFilter filter, int radius)
	{
		return FindNearby(GridUtils.PositionToCoords(centerPosition, size), size, filter, radius);
	}

	public static int FindNearby(out float distance, Vector2Int centerCoords, Vector2Int size, IMapFilter filter, int radius = 3)
	{
		float num = float.PositiveInfinity;
		int result = -1;
		int num2 = Mathf.Max(0, centerCoords.x - radius);
		int num3 = Mathf.Max(0, centerCoords.y - radius);
		int num4 = Mathf.Min(size.x, centerCoords.x + radius + 1);
		int num5 = Mathf.Min(size.y, centerCoords.y + radius + 1);
		for (int i = num2; i < num4; i++)
		{
			for (int j = num3; j < num5; j++)
			{
				Vector2Int vector2Int = new Vector2Int(i, j);
				int num6 = GridUtils.CoordsToIndex(vector2Int, size);
				if (filter.IsValid(num6))
				{
					float num7 = (vector2Int - centerCoords).sqrMagnitude;
					if (num7 < num)
					{
						num = num7;
						result = num6;
					}
				}
			}
		}
		distance = Mathf.Sqrt(num);
		return result;
	}

	public static bool CheckConditionNearby(Func<int, bool> condition, int radius, Vector2Int centerCoords, Vector2Int size)
	{
		int num = Mathf.Max(0, centerCoords.x - radius);
		int num2 = Mathf.Max(0, centerCoords.y - radius);
		int num3 = Mathf.Min(size.x, centerCoords.x + radius + 1);
		int num4 = Mathf.Min(size.y, centerCoords.y + radius + 1);
		for (int i = num; i < num3; i++)
		{
			for (int j = num2; j < num4; j++)
			{
				int arg = GridUtils.CoordsToIndex(new Vector2Int(i, j), size);
				if (!condition(arg))
				{
					return false;
				}
			}
		}
		return true;
	}

	public static bool CheckConditionNearby(Func<int, bool> condition, int radius, Vector2 centerPosition, Vector2Int size)
	{
		return CheckConditionNearby(condition, radius, GridUtils.PositionToCoords(centerPosition, size), size);
	}

	public static bool CheckConditionNearby(Func<int, bool> condition, int radius, int centerIndex, Vector2Int size)
	{
		return CheckConditionNearby(condition, radius, GridUtils.IndexToCoords(centerIndex, size), size);
	}

	public static Vector2 Centroid(Vector2Int size, IEnumerable<int> tiles)
	{
		Vector2 zero = Vector2.zero;
		int num = 0;
		foreach (int tile in tiles)
		{
			zero += GridUtils.IndexToPosition(tile, size);
			num++;
		}
		return zero / num;
	}

	public static Vector2 Centroid(IEnumerable<Vector2> dataPoints)
	{
		Vector2 zero = Vector2.zero;
		int num = 0;
		foreach (Vector2 dataPoint in dataPoints)
		{
			zero += dataPoint;
			num++;
		}
		return zero / num;
	}

	public static void BoundingBoxAndCentroid(Vector2Int size, IEnumerable<int> tiles, out Rect boundingBox, out Vector2 centroid)
	{
		Vector2 rhs = -100000000f * Vector2.one;
		Vector2 rhs2 = 100000000f * Vector2.one;
		centroid = Vector2.zero;
		int num = 0;
		foreach (int tile in tiles)
		{
			Vector2 vector = GridUtils.IndexToPosition(tile, size);
			rhs = Vector2.Max(vector, rhs);
			rhs2 = Vector2.Min(vector, rhs2);
			centroid += vector;
			num++;
		}
		boundingBox = default(Rect);
		boundingBox.xMax = rhs.x;
		boundingBox.yMax = rhs.y;
		boundingBox.xMin = rhs2.x;
		boundingBox.yMin = rhs2.y;
		centroid /= (float)num;
	}

	public static bool IsFreeForEncounter(this ObstacleState state)
	{
		return state == ObstacleState.Free;
	}

	public static bool IsFreeForObstacles(this ObstacleState state)
	{
		if (state != ObstacleState.Free)
		{
			return state == ObstacleState.NoEncounters;
		}
		return true;
	}

	public static bool CanBeRoad(this ObstacleState state)
	{
		if (state != ObstacleState.AlwaysFree && state != ObstacleState.ReservedWalkable)
		{
			return state == ObstacleState.ReservedRoadTarget;
		}
		return true;
	}

	public static bool IsWalkable(this ObstacleState state)
	{
		if (state != ObstacleState.Free && state != ObstacleState.NoEncounters && state != ObstacleState.AlwaysFree)
		{
			return state == ObstacleState.ReservedWalkable;
		}
		return true;
	}

	public static bool IsObstacle(this ObstacleState state)
	{
		if (state != ObstacleState.Obstacle && state != ObstacleState.AlwaysObstacle)
		{
			return state == ObstacleState.Border;
		}
		return true;
	}

	public static bool NeedsGroundConnection(this ConnectionType type)
	{
		if (type != ConnectionType.Direct)
		{
			return type == ConnectionType.GladiatorArena;
		}
		return true;
	}

	public static bool CanHaveGroundConnection(this ConnectionType type)
	{
		if (type != ConnectionType.Direct && type != ConnectionType.GladiatorArena)
		{
			return type == ConnectionType.Default;
		}
		return true;
	}

	public static bool NeedsAdjacency(this ConnectionType type)
	{
		if (type != ConnectionType.Direct && type != ConnectionType.GladiatorArena)
		{
			return type == ConnectionType.Proximity;
		}
		return true;
	}

	public static void FillArray<T>(T[] array, T value)
	{
		for (int i = 0; i < array.Length; i++)
		{
			array[i] = value;
		}
	}

	public static T[] CopyArray<T>(T[] array)
	{
		T[] array2 = new T[array.Length];
		for (int i = 0; i < array.Length; i++)
		{
			array2[i] = array[i];
		}
		return array2;
	}

	public static void ShiftList<T>(List<T> list, int offset)
	{
		while (offset < 0)
		{
			offset += list.Count;
		}
		while (offset >= list.Count)
		{
			offset -= list.Count;
		}
		list.Reverse(0, list.Count);
		list.Reverse(0, offset);
		list.Reverse(offset, list.Count - offset);
	}

	public static void InitializeArray<T>(T[] array) where T : new()
	{
		for (int i = 0; i < array.Length; i++)
		{
			array[i] = new T();
		}
	}

	public static int CombineHashes(int hash0, int hash1)
	{
		return (1009 * 9176 + hash0) * 9176 + hash1;
	}

	public static bool IsInValueBracket(int value, int min, int max)
	{
		if (min < 0 || value >= min)
		{
			if (max >= 0)
			{
				return value < max;
			}
			return true;
		}
		return false;
	}

	public static bool IsArrayNullOrEmpty<T>(T[] array)
	{
		if (array != null)
		{
			return array.Length == 0;
		}
		return true;
	}

	public static List<Vector2> GetPositionsFromTiles(List<int> tiles, Vector2Int mapSize)
	{
		List<Vector2> list = new List<Vector2>(tiles.Count);
		for (int i = 0; i < tiles.Count; i++)
		{
			list.Add(GridUtils.IndexToPosition(tiles[i], mapSize));
		}
		return list;
	}
}
