using System;
using System.Collections.Generic;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public static class ZoneMapper
{
	private const int SectorCount = 32;

	private static ProfilerMarker ProfilerMarker = new ProfilerMarker("MapZones");

	public static void MapZones(out ZoneMap zoneMap, out Vector2[] zonePositions, out float zoneSizeScale, System.Random random, Vector2Int mapSize, MapDescription mapDesc)
	{
		int count = mapDesc.zones.Count;
		int count2 = mapDesc.connections.Count;
		float[] array = new float[count];
		for (int i = 0; i < count; i++)
		{
			array[i] = mapDesc.zones[i].size;
		}
		float[,] array2 = new float[count, count];
		for (int j = 0; j < count; j++)
		{
			for (int k = 0; k < count; k++)
			{
				array2[j, k] = -1f;
			}
		}
		PairSet pairSet = new PairSet(count);
		List<Vector2Int> list = new List<Vector2Int>(count2);
		for (int l = 0; l < count2; l++)
		{
			MapDescription.Connection connection = mapDesc.connections[l];
			int num = connection.from;
			int to = connection.to;
			Vector2Int vector2Int = new Vector2Int(num, to);
			if (connection.connectionType.NeedsGroundConnection())
			{
				list.Add(vector2Int);
			}
			if (connection.connectionType.NeedsAdjacency())
			{
				pairSet.Set(vector2Int, value: true);
				float num2 = array[num] + array[to] + connection.length;
				float num3 = array2[num, to];
				if (num3 < 0f || num2 < num3)
				{
					array2[num, to] = num2;
					array2[to, num] = num2;
				}
			}
		}
		for (int m = 0; m < count; m++)
		{
			for (int n = 0; n < count; n++)
			{
				if (array2[m, n] < 0f)
				{
					array2[m, n] = array[m] + array[n];
				}
			}
		}
		Vector2Int[] connections = list.ToArray();
		(Vector2[], float) tuple = ZoneGraph.EmbedGraph(random, pairSet, array2, array, mapDesc.orientation);
		zonePositions = tuple.Item1;
		zoneSizeScale = tuple.Item2;
		byte[] sectorMap = MapZonesToSectors(zonePositions, zoneSizeScale, connections, array);
		zoneMap = new ZoneMap(MapSectorsToTiles(random, mapSize, sectorMap, zonePositions));
	}

	private static byte[] MapZonesToSectors(Vector2[] zonePositions, float sizeScale, Vector2Int[] connections, float[] relativeSizes)
	{
		byte[] array = new byte[1024];
		List<Vector2Int> list = FilterConnections(connections, zonePositions);
		Utils.FillArray(array, byte.MaxValue);
		List<int> list2 = new List<int>();
		for (int i = 0; i < zonePositions.Length; i++)
		{
			Vector2Int vector2Int = GridUtils.PositionToCoords(zonePositions[i], Vector2Int.one * 32);
			array[vector2Int.x + vector2Int.y * 32] = (byte)i;
			list2.Add(vector2Int.x + vector2Int.y * 32);
		}
		for (int j = 0; j < list.Count; j++)
		{
			byte b = (byte)list[j].x;
			byte b2 = (byte)list[j].y;
			DrawRasterLine(array, b, b2, relativeSizes[b] / (relativeSizes[b2] + relativeSizes[b]), GridUtils.PositionToCoords(zonePositions[b], Vector2Int.one * 32), GridUtils.PositionToCoords(zonePositions[b2], Vector2Int.one * 32));
		}
		for (int k = 0; k < zonePositions.Length; k++)
		{
			DrawRasterCircle(array, (byte)k, zonePositions[k], relativeSizes[k] * sizeScale * 0.5f);
		}
		VoronoiJumpFlood(array);
		byte[] array2 = Utils.CopyArray(array);
		Utils.FillArray(array, byte.MaxValue);
		List<int>[] array3 = new List<int>[zonePositions.Length];
		FloodFiller floodFiller = new FloodFiller(Vector2Int.one * 32);
		MapFilterValue<byte> mapFilterValue = new MapFilterValue<byte>(array2, 0);
		floodFiller.AttachFilter(mapFilterValue);
		for (int l = 0; l < list2.Count; l++)
		{
			array3[l] = new List<int>();
			mapFilterValue.SetValue((byte)l);
			floodFiller.SetOutList(array3[l]);
			floodFiller.FloodFill(list2[l], Neighbourhood.Cardinal);
			byte b3 = array2[list2[l]];
			for (int m = 0; m < array3[l].Count; m++)
			{
				array[array3[l][m]] = b3;
			}
		}
		VoronoiJumpFlood(array);
		return array;
	}

	private static byte[] MapSectorsToTiles(System.Random random, Vector2Int size, byte[] sectorMap, Vector2[] zonePositions)
	{
		byte[] array = new byte[size.x * size.y];
		Vector2[] array2 = new Vector2[sectorMap.Length];
		for (int i = 0; i < array2.Length; i++)
		{
			array2[i] = GridUtils.IndexToPosition(i, Vector2Int.one * 32) + Vector2.one * 0.5f / 32f;
			array2[i] += new Vector2((float)random.NextDouble() - 0.5f, (float)random.NextDouble() - 0.5f) * 0.5f / 32f;
		}
		float num = (float)random.NextDouble() * 1000f;
		float num2 = num + 100f;
		for (int j = 0; j < size.x * size.y; j++)
		{
			Vector2 vector = GridUtils.IndexToPosition(j, size);
			vector += new Vector2(1f / (float)size.x, 1f / (float)size.y);
			float num3 = Mathf.PerlinNoise(vector.x * 10f, vector.y * 10f + num);
			float num4 = Mathf.PerlinNoise(vector.x * 10f, vector.y * 10f + num2);
			Vector2 vector2 = new Vector2(num3 - 0.5f, num4 - 0.5f) * 0.05f;
			vector += vector2;
			vector = new Vector2(Mathf.Clamp(vector.x, 0f, 0.999f), Mathf.Clamp(vector.y, 0f, 0.999f));
			int num5 = GridUtils.CoordsToIndex(GridUtils.PositionToCoords(vector, Vector2Int.one * 32), Vector2Int.one * 32);
			byte b = sectorMap[num5];
			float num6 = (vector - array2[num5]).sqrMagnitude;
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(num5, Vector2Int.one * 32).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				float sqrMagnitude = (vector - array2[current]).sqrMagnitude;
				if (sqrMagnitude < num6)
				{
					num6 = sqrMagnitude;
					b = sectorMap[current];
				}
			}
			array[j] = b;
		}
		SmoothBorders(array, size);
		SmoothBorders(array, size);
		List<int>[] array3 = new List<int>[zonePositions.Length];
		MapFilterValue<byte> mapFilterValue = new MapFilterValue<byte>(array, 0);
		FloodFiller floodFiller = new FloodFiller(size);
		floodFiller.AttachFilter(mapFilterValue);
		for (int k = 0; k < zonePositions.Length; k++)
		{
			mapFilterValue.SetValue((byte)k);
			int num7 = Utils.FindNearby(zonePositions[k], size, mapFilterValue, 1000);
			GeneratorException.ThrowIfFalse(num7 >= 0, "Zone was not found on the map.", Log.Context.ZoneIndex(k));
			array3[k] = new List<int>();
			floodFiller.SetOutList(array3[k]);
			floodFiller.FloodFill(num7, Neighbourhood.Cardinal);
		}
		Utils.FillArray(array, byte.MaxValue);
		for (int l = 0; l < array3.Length; l++)
		{
			List<int> list = array3[l];
			for (int m = 0; m < list.Count; m++)
			{
				array[list[m]] = (byte)l;
			}
		}
		return array;
	}

	private static void SmoothBorders(byte[] map, Vector2Int size)
	{
		byte[] array = Utils.CopyArray(map);
		int[] array2 = new int[256];
		for (int i = 0; i < map.Length; i++)
		{
			int num = 0;
			for (int j = 0; j < array2.Length; j++)
			{
				array2[j] = 0;
			}
			byte b = array[i];
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(i, size, skipOutOfBounds: false).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				if (current >= 0)
				{
					if (b == array[current])
					{
						num++;
					}
					array2[array[current]]++;
				}
				else
				{
					num++;
				}
			}
			if (num >= 4)
			{
				continue;
			}
			int num2 = -1;
			int num3 = array[i];
			for (int k = 0; k < array2.Length; k++)
			{
				if (array2[k] > num2)
				{
					num2 = array2[k];
					num3 = k;
				}
			}
			map[i] = (byte)num3;
		}
	}

	private static List<Vector2Int> FilterConnections(Vector2Int[] rawConnections, Vector2[] positions)
	{
		List<Vector2Int> list = new List<Vector2Int>(rawConnections.Length);
		for (int i = 0; i < rawConnections.Length; i++)
		{
			list.Add(rawConnections[i]);
		}
		list.Sort(delegate(Vector2Int lhs, Vector2Int rhs)
		{
			float sqrMagnitude = (positions[lhs.x] - positions[lhs.y]).sqrMagnitude;
			float sqrMagnitude2 = (positions[rhs.x] - positions[rhs.y]).sqrMagnitude;
			if (sqrMagnitude2 == sqrMagnitude)
			{
				return 0;
			}
			return (!(sqrMagnitude2 > sqrMagnitude)) ? 1 : (-1);
		});
		for (int num = rawConnections.Length - 1; num >= 0; num--)
		{
			bool flag = false;
			for (int num2 = 0; num2 < num; num2++)
			{
				if (CheckConnectionsInteresction(positions, list[num], list[num2]))
				{
					flag = true;
					break;
				}
			}
			if (flag)
			{
				list.RemoveAt(num);
			}
		}
		return list;
	}

	private static void DrawRasterLine(byte[] map, byte id0, byte id1, float sizeRatio, Vector2Int point0, Vector2Int point1)
	{
		float magnitude = (point0 - point1).magnitude;
		int num = point1.x - point0.x;
		int num2 = point1.y - point0.y;
		bool num3 = Mathf.Abs(num2) > Mathf.Abs(num);
		float num4 = (num3 ? ((float)num / (float)num2) : ((float)num2 / (float)num));
		int num5 = (int)Mathf.Sign(num3 ? num2 : num);
		if (num3)
		{
			for (int i = point0.y + num5; i != point1.y; i += num5)
			{
				int num6 = Mathf.RoundToInt(num4 * (float)(i - point0.y) + (float)point0.x);
				int num7 = num6 + i * 32;
				if (map[num7] == byte.MaxValue)
				{
					if ((point0 - new Vector2Int(num6, i)).magnitude > sizeRatio * magnitude)
					{
						map[num7] = id1;
					}
					else
					{
						map[num7] = id0;
					}
				}
			}
			return;
		}
		for (int j = point0.x + num5; j != point1.x; j += num5)
		{
			int num8 = Mathf.RoundToInt(num4 * (float)(j - point0.x) + (float)point0.y);
			int num9 = j + num8 * 32;
			if (map[num9] == byte.MaxValue)
			{
				if ((point0 - new Vector2Int(j, num8)).magnitude > sizeRatio * magnitude)
				{
					map[num9] = id1;
				}
				else
				{
					map[num9] = id0;
				}
			}
		}
	}

	private static void DrawRasterCircle(byte[] map, byte id, Vector2 position, float radius)
	{
		float num = radius * radius;
		position = Vector2Int.FloorToInt(position * 32f);
		position /= 32f;
		for (int i = 0; i < map.Length; i++)
		{
			if (map[i] == byte.MaxValue && (GridUtils.IndexToPosition(i, Vector2Int.one * 32) - position).sqrMagnitude < num)
			{
				map[i] = id;
			}
		}
	}

	private static void BruteForceVoronoi(byte[] map)
	{
		List<byte> list = new List<byte>();
		List<Vector2> list2 = new List<Vector2>();
		Vector2Int size = Vector2Int.one * 32;
		for (int i = 0; i < map.Length; i++)
		{
			if (map[i] != byte.MaxValue)
			{
				list.Add(map[i]);
				list2.Add(GridUtils.IndexToCoords(i, size));
			}
		}
		for (int j = 0; j < map.Length; j++)
		{
			if (map[j] != byte.MaxValue)
			{
				continue;
			}
			int index = -1;
			float num = float.MaxValue;
			Vector2 vector = GridUtils.IndexToCoords(j, size);
			for (int k = 0; k < list.Count; k++)
			{
				float sqrMagnitude = (vector - list2[k]).sqrMagnitude;
				if (sqrMagnitude < num)
				{
					index = k;
					num = sqrMagnitude;
				}
			}
			map[j] = list[index];
		}
	}

	private static void VoronoiJumpFlood(byte[] map)
	{
		Vector2Int vector2Int = new Vector2Int(-1, -1);
		Vector2Int[,] array = new Vector2Int[32, 32];
		for (int i = 0; i < 32; i++)
		{
			for (int j = 0; j < 32; j++)
			{
				if (map[i + 32 * j] == byte.MaxValue)
				{
					array[i, j] = vector2Int;
				}
				else
				{
					array[i, j] = new Vector2Int(i, j);
				}
			}
		}
		int num = (int)Mathf.Log(32f, 2f);
		for (int k = 0; k < num + 1; k++)
		{
			int num2 = (int)Mathf.Pow(2f, Mathf.Max(0, num - 1 - k));
			for (int l = 0; l < 32; l++)
			{
				for (int m = 0; m < 32; m++)
				{
					Vector2Int vector2Int2 = vector2Int;
					float num3 = float.PositiveInfinity;
					for (int n = -1; n <= 1; n++)
					{
						for (int num4 = -1; num4 <= 1; num4++)
						{
							int num5 = Mathf.Clamp(l + n * num2, 0, 31);
							int num6 = Mathf.Clamp(m + num4 * num2, 0, 31);
							Vector2Int vector2Int3 = array[num5, num6];
							if (vector2Int3 != vector2Int)
							{
								Vector2Int vector2Int4 = vector2Int3 - new Vector2Int(l, m);
								float num7 = Vector2.Dot(vector2Int4, vector2Int4);
								if (num7 < num3)
								{
									num3 = num7;
									vector2Int2 = vector2Int3;
								}
							}
						}
					}
					array[l, m] = vector2Int2;
				}
			}
		}
		for (int num8 = 0; num8 < 32; num8++)
		{
			for (int num9 = 0; num9 < 32; num9++)
			{
				Vector2Int vector2Int5 = array[num8, num9];
				if (vector2Int5 != vector2Int)
				{
					map[num8 + 32 * num9] = map[vector2Int5.x + vector2Int5.y * 32];
				}
			}
		}
	}

	private static bool CheckConnectionsInteresction(Vector2[] positions, Vector2Int connection0, Vector2Int connection1)
	{
		bool num = connection0.x == connection1.x || connection0.y == connection1.y || connection0.x == connection1.y || connection0.y == connection1.x;
		Vector2 p = positions[connection0.x];
		Vector2 p2 = positions[connection0.y];
		Vector2 q = positions[connection1.x];
		Vector2 q2 = positions[connection1.y];
		if (num)
		{
			return false;
		}
		return CheckSegmentsIntersection(p, p2, q, q2);
	}

	private static bool CheckSegmentsIntersection(Vector2 p0, Vector2 p1, Vector2 q0, Vector2 q1)
	{
		Vector2 vector = p1 - p0;
		vector = new Vector2(vector.y, 0f - vector.x).normalized;
		Vector2 vector2 = q1 - q0;
		vector2 = new Vector2(vector2.y, 0f - vector2.x).normalized;
		float num = Vector2.Dot(vector, q0 - p0);
		float num2 = Vector2.Dot(vector, q1 - p0);
		float num3 = Vector2.Dot(vector2, p0 - q0);
		float num4 = Vector2.Dot(vector2, p1 - q0);
		bool flag = num * num2 < 0f;
		return num3 * num4 < 0f && flag;
	}

	private static Vector2Int Edge(int index0, int index1)
	{
		return new Vector2Int(Mathf.Min(index0, index1), Mathf.Max(index0, index1));
	}
}
