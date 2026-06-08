using System;
using System.Collections.Generic;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public static class Gates
{
	private static ProfilerMarker ProfilerMarker = new ProfilerMarker("PlaceGates");

	private static int[] WideGateCenterOffsets = new int[5] { 0, -1, 1, -2, 2 };

	public static void PlaceGates(out Gate[] allGates, out Gate[] zoneGates, int[] subzoneMap, ZoneMap zoneMap, sbyte[] elevationMap, ObstacleState[] obstacleMap, int subzoneCount, System.Random random, Vector2Int mapSize, MapDescription mapDesc, ReadOnlyArray<Vector2> zonePositions)
	{
		(byte[], bool[][], Dictionary<Vector2Int, int>, Dictionary<Vector2Int, List<int>>) tuple = PrepareData(subzoneCount, mapSize, mapDesc, zoneMap, subzoneMap, obstacleMap);
		byte[] item = tuple.Item1;
		bool[][] item2 = tuple.Item2;
		Dictionary<Vector2Int, int> item3 = tuple.Item3;
		Dictionary<Vector2Int, List<int>> item4 = tuple.Item4;
		int count = item4.Count;
		int count2 = item3.Count;
		Dictionary<Vector2Int, List<Gate>> dictionary = new Dictionary<Vector2Int, List<Gate>>(count);
		foreach (Vector2Int key in item4.Keys)
		{
			dictionary[key] = new List<Gate>();
		}
		Dictionary<Vector2Int, List<Gate>> dictionary2 = new Dictionary<Vector2Int, List<Gate>>(count);
		List<Gate>[] array = new List<Gate>[count2];
		for (int i = 0; i < count2; i++)
		{
			array[i] = new List<Gate>();
		}
		for (int j = 0; j < zoneMap.Length; j++)
		{
			Gate gate = FindPotentialGate(j, mapSize, subzoneMap, item2, elevationMap, obstacleMap, item);
			if (!gate.isValid)
			{
				continue;
			}
			byte b = item[gate.subzoneFrom];
			byte b2 = item[gate.subzoneTo];
			int value3;
			if (b != b2)
			{
				if (dictionary.TryGetValue(Utils.Order(b, b2), out var value))
				{
					if (gate.isRamp)
					{
						value.Add(new Gate(gate.subzoneFrom, gate.subzoneTo, gate.zoneFrom, gate.zoneTo, gate.positionFrom, gate.positionTo, gate.rampPosition, gate.rampWidth, gate.elevation, b, mapSize));
						value.Add(new Gate(gate.subzoneFrom, gate.subzoneTo, gate.zoneFrom, gate.zoneTo, gate.positionFrom, gate.positionTo, gate.rampPosition, gate.rampWidth, gate.elevation, b2, mapSize));
					}
					else
					{
						value.Add(gate);
					}
				}
				if (dictionary2.TryGetValue(Utils.Order(b, b2), out var value2))
				{
					Gate item5 = FindPotentialWideGate(gate, mapSize, subzoneMap, item2, elevationMap, obstacleMap);
					if (item5.isValid)
					{
						value2.Add(item5);
					}
				}
			}
			else if (item3.TryGetValue(Utils.Order(gate.subzoneFrom, gate.subzoneTo), out value3))
			{
				array[value3].Add(gate);
			}
		}
		List<Gate> list = new List<Gate>();
		zoneGates = new Gate[mapDesc.connections.Count];
		bool[] gateFreeMap = new bool[zoneMap.Length];
		foreach (Vector2Int key2 in dictionary.Keys)
		{
			List<Gate> list2 = dictionary[key2];
			if (list2.Count == 0)
			{
				continue;
			}
			List<int> connectionIndices = item4[key2];
			list2 = MergeRamps(list2, mapSize);
			dictionary2.TryGetValue(key2, out var value4);
			List<Gate> collection = PickConnectionGates(zoneGates, connectionIndices, list2, value4, mapSize, mapDesc, gateFreeMap, zoneMap, zonePositions, random);
			list.AddRange(collection);
			for (int k = 0; k < zoneGates.Length; k++)
			{
				Gate gateParams = zoneGates[k];
				if (gateParams.isValid)
				{
					bool reserveSpace = mapDesc.connections[k].connectionType == ConnectionType.GladiatorArena;
					PlaceGate(gateParams, reserveSpace, mapSize, zoneMap, subzoneMap, elevationMap, obstacleMap, item);
				}
			}
		}
		for (int l = 0; l < count2; l++)
		{
			if (array[l].Count == 0)
			{
				continue;
			}
			array[l] = MergeRamps(array[l], mapSize);
			List<Gate> list3 = PickSubzoneGates(array[l], mapSize, gateFreeMap, subzoneMap, random);
			list.AddRange(list3);
			foreach (Gate item6 in list3)
			{
				PlaceGate(item6, reserveSpace: false, mapSize, zoneMap, subzoneMap, elevationMap, obstacleMap, item);
			}
		}
		allGates = list.ToArray();
		FilterSubzoneMap(subzoneMap, zoneMap, obstacleMap);
	}

	private static (byte[], bool[][], Dictionary<Vector2Int, int>, Dictionary<Vector2Int, List<int>>) PrepareData(int subzoneCount, Vector2Int mapSize, MapDescription mapDesc, ZoneMap zoneMap, int[] subzoneMap, ObstacleState[] obstacles)
	{
		int[] array = new int[subzoneCount];
		for (int i = 0; i < subzoneCount; i++)
		{
			Vector2 zero = Vector2.zero;
			int num = 0;
			for (int j = 0; j < mapSize.x * mapSize.y; j++)
			{
				if (subzoneMap[j] == i && obstacles[j].IsWalkable())
				{
					zero += (Vector2)GridUtils.IndexToCoords(j, mapSize);
					num++;
				}
			}
			GeneratorException.ThrowIfFalse(num != 0, "Subzone size is zero.", Log.Context.none);
			zero /= (float)num;
			float num2 = float.MaxValue;
			int num3 = -1;
			for (int k = 0; k < mapSize.x * mapSize.y; k++)
			{
				if (subzoneMap[k] == i && obstacles[k].IsWalkable())
				{
					float sqrMagnitude = (GridUtils.IndexToCoords(k, mapSize) - zero).sqrMagnitude;
					if (sqrMagnitude < num2)
					{
						num3 = k;
						num2 = sqrMagnitude;
					}
				}
			}
			array[i] = num3;
		}
		FloodFiller floodFiller = new FloodFiller(mapSize);
		MapFilterValue<int> mapFilterValue = new MapFilterValue<int>(subzoneMap, 0);
		MapFilterCondition filter = new MapFilterCondition((int index) => obstacles[index].IsWalkable());
		floodFiller.AttachFilter(mapFilterValue);
		floodFiller.AttachFilter(filter);
		bool[][] array2 = new bool[subzoneCount][];
		for (int num4 = 0; num4 < subzoneCount; num4++)
		{
			int num5 = array[num4];
			mapFilterValue.SetValue(subzoneMap[num5]);
			bool[] array3 = new bool[subzoneMap.Length];
			floodFiller.SetOutMask(array3);
			floodFiller.FloodFill(num5, Neighbourhood.All);
			bool[] array4 = Utils.CopyArray(array3);
			for (int num6 = 0; num6 < subzoneMap.Length; num6++)
			{
				if (subzoneMap[num6] != num4 || obstacles[num6].IsFreeForObstacles())
				{
					continue;
				}
				GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursCardinal(num6, mapSize).GetEnumerator();
				while (enumerator.MoveNext())
				{
					int current = enumerator.Current;
					if (array4[current] && obstacles[current].IsFreeForObstacles())
					{
						array3[num6] = true;
						break;
					}
				}
			}
			array2[num4] = array3;
		}
		byte[] array5 = new byte[subzoneCount];
		for (int num7 = 0; num7 < mapSize.x * mapSize.y; num7++)
		{
			int num8 = subzoneMap[num7];
			if (num8 != -1)
			{
				array5[num8] = zoneMap[num7].Value;
			}
		}
		Dictionary<Vector2Int, List<int>> dictionary = new Dictionary<Vector2Int, List<int>>();
		for (int num9 = 0; num9 < mapDesc.connections.Count; num9++)
		{
			MapDescription.Connection connection = mapDesc.connections[num9];
			if (connection.connectionType.CanHaveGroundConnection())
			{
				Vector2Int key = Utils.Order(connection.from, connection.to);
				if (!dictionary.TryGetValue(key, out var value))
				{
					value = (dictionary[key] = new List<int>());
				}
				value.Add(num9);
			}
		}
		Dictionary<Vector2Int, int> dictionary2 = new Dictionary<Vector2Int, int>();
		int num10 = 0;
		for (int num11 = 0; num11 < zoneMap.Length; num11++)
		{
			byte? b = zoneMap[num11];
			int num12 = subzoneMap[num11];
			if (num12 == -1)
			{
				continue;
			}
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursCardinal(num11, mapSize).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current2 = enumerator.Current;
				byte? b2 = zoneMap[current2];
				int num13 = subzoneMap[current2];
				if (num13 != -1 && b == b2 && num13 != num12)
				{
					Vector2Int key2 = Utils.Order(num12, num13);
					if (!dictionary2.ContainsKey(key2))
					{
						dictionary2.Add(key2, num10);
						num10++;
					}
				}
			}
		}
		return (array5, array2, dictionary2, dictionary);
	}

	private static Gate FindPotentialGate(int index, Vector2Int mapSize, int[] subzoneMap, bool[][] reachableMasks, sbyte[] elevationMap, ObstacleState[] obstacles, byte[] zoneOfSubzone)
	{
		Gate result = default(Gate);
		Vector2Int vector2Int = GridUtils.IndexToCoords(index, mapSize);
		if (vector2Int.x < 2 || vector2Int.y < 2 || vector2Int.x > mapSize.x - 3 || vector2Int.y > mapSize.y - 3)
		{
			return result;
		}
		int num = subzoneMap[index];
		if (num == -1)
		{
			return result;
		}
		int num2 = -1;
		if (!reachableMasks[num][index])
		{
			return result;
		}
		sbyte b = elevationMap[index];
		sbyte b2 = 0;
		bool flag = false;
		bool flag2 = false;
		bool flag3 = obstacles[index] == ObstacleState.Cliff;
		int num3 = -1;
		bool flag4 = true;
		GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(index, mapSize).GetEnumerator();
		while (enumerator.MoveNext())
		{
			int current = enumerator.Current;
			int num4 = subzoneMap[current];
			if (num4 == -1)
			{
				flag2 = true;
				break;
			}
			flag3 |= obstacles[current] == ObstacleState.Cliff;
			sbyte b3 = elevationMap[current];
			if (num4 == num)
			{
				if (b3 != b)
				{
					flag = true;
					break;
				}
			}
			else
			{
				if (num2 == -1)
				{
					num2 = num4;
					b2 = b3;
				}
				if (num2 != -1)
				{
					if (num4 != num2)
					{
						flag2 = true;
						break;
					}
					if (b3 != b2)
					{
						flag = true;
						break;
					}
					if (flag4 && reachableMasks[num2][current])
					{
						num3 = current;
					}
				}
			}
			flag4 = !flag4;
		}
		if (num2 == -1 || flag2 || flag)
		{
			return result;
		}
		byte b4 = zoneOfSubzone[num];
		byte b5 = zoneOfSubzone[num2];
		if (b == b2)
		{
			if (num3 >= 0 && !flag3)
			{
				return new Gate(num, num2, b4, b5, index, num3);
			}
		}
		else
		{
			bool num5 = b > b2;
			int subzoneFrom = (num5 ? num : num2);
			int num6 = (num5 ? num2 : num);
			byte zoneFrom = (num5 ? b4 : b5);
			byte zoneTo = (num5 ? b5 : b4);
			sbyte elevation = (num5 ? b : b2);
			int num7 = (num5 ? index : num3);
			int num8 = (num5 ? num3 : index);
			if (num8 < 0)
			{
				enumerator = GridUtils.GetNeighboursCardinal(index, mapSize).GetEnumerator();
				while (enumerator.MoveNext())
				{
					int current2 = enumerator.Current;
					if (subzoneMap[current2] == num6)
					{
						Vector2Int vector2Int2 = GridUtils.IndexToCoords(current2, mapSize);
						GridUtils.NeighboursIterator enumerator2 = GridUtils.GetNeighboursCardinal(current2, mapSize).GetEnumerator();
						while (enumerator2.MoveNext())
						{
							int current3 = enumerator2.Current;
							if (subzoneMap[current3] != num6)
							{
								continue;
							}
							Vector2Int vector2Int3 = GridUtils.IndexToCoords(current3, mapSize) - vector2Int2;
							int index2 = Direction.FromVector(vector2Int3);
							int neighbour = GridUtils.GetNeighbour(vector2Int3, current3, mapSize);
							if (neighbour < 0 || obstacles[neighbour] != ObstacleState.Free)
							{
								continue;
							}
							Vector2Int vector2Int4 = Direction.FromIndex(Direction.Clockwise(index2));
							bool flag5 = true;
							for (int i = -1; i <= 1; i += 2)
							{
								int neighbour2 = GridUtils.GetNeighbour(vector2Int4 * i, current3, mapSize);
								if (neighbour2 != -1 && obstacles[neighbour2] == ObstacleState.Free)
								{
									neighbour = GridUtils.GetNeighbour(vector2Int3 + vector2Int4 * i, current3, mapSize);
									if (neighbour < 0 || obstacles[neighbour] != ObstacleState.Free)
									{
										flag5 = false;
										break;
									}
									neighbour = GridUtils.GetNeighbour(vector2Int4 * (i + 1), current3, mapSize);
									if (neighbour < 0 || obstacles[neighbour] != ObstacleState.Free)
									{
										flag5 = false;
										break;
									}
								}
							}
							if (flag5)
							{
								num7 = current2;
								num8 = current3;
								break;
							}
						}
					}
					if (num8 >= 0)
					{
						break;
					}
				}
			}
			if (num7 >= 0 && num8 >= 0)
			{
				int neighbour3 = GridUtils.GetNeighbour((GridUtils.IndexToCoords(num8, mapSize) - GridUtils.IndexToCoords(num7, mapSize)) * 2, num7, mapSize);
				return new Gate(subzoneFrom, num6, zoneFrom, zoneTo, num7, neighbour3, num8, 1, elevation, -1, mapSize);
			}
		}
		return result;
	}

	private static Gate FindPotentialWideGate(Gate baseGate, Vector2Int mapSize, int[] subzoneMap, bool[][] reachableMasks, sbyte[] elevationMap, ObstacleState[] obstacles)
	{
		Gate result = default(Gate);
		if (!baseGate.isValid)
		{
			return result;
		}
		if (baseGate.isRamp)
		{
			return result;
		}
		int subzoneFrom = baseGate.subzoneFrom;
		int subzoneTo = baseGate.subzoneTo;
		sbyte elevation = baseGate.elevation;
		int positionFrom = baseGate.positionFrom;
		Vector2Int vector2Int = GridUtils.IndexToCoords(positionFrom, mapSize);
		Vector2Int dir = GridUtils.IndexToCoords(baseGate.positionTo, mapSize) - vector2Int;
		int num = -1;
		int num2 = -1;
		int index = Direction.FromVector(dir);
		int index2 = Direction.Inverse(index);
		for (int i = -2; i <= 2; i++)
		{
			for (int j = -2; j <= 2; j++)
			{
				Vector2Int coords = vector2Int + new Vector2Int(i, j);
				if (!GridUtils.CheckBounds(coords, mapSize))
				{
					return result;
				}
				int num3 = GridUtils.CoordsToIndex(coords, mapSize);
				if (elevationMap[num3] != elevation)
				{
					return result;
				}
				int num4 = subzoneMap[num3];
				if (num4 != subzoneFrom && num4 != subzoneTo)
				{
					return result;
				}
				ObstacleState obstacleState = obstacles[num3];
				if (obstacleState != ObstacleState.Free && obstacleState != ObstacleState.Border)
				{
					return result;
				}
			}
		}
		int[] wideGateCenterOffsets = WideGateCenterOffsets;
		foreach (int num5 in wideGateCenterOffsets)
		{
			Vector2Int vector2Int2 = Direction.FromIndex(index2);
			Vector2Int vector2Int3 = Direction.FromIndex(Direction.Clockwise(index2));
			Vector2Int vector2Int4 = vector2Int2 * 3 + vector2Int3 * num5;
			Vector2Int coords2 = vector2Int + vector2Int4;
			if (GridUtils.CheckBounds(coords2, mapSize))
			{
				int num6 = GridUtils.CoordsToIndex(coords2, mapSize);
				if (elevationMap[num6] == elevation && obstacles[num6] == ObstacleState.Free && subzoneMap[num6] == subzoneFrom && reachableMasks[subzoneFrom][num6])
				{
					num = num6;
					break;
				}
			}
		}
		if (num == -1)
		{
			return result;
		}
		wideGateCenterOffsets = WideGateCenterOffsets;
		foreach (int num7 in wideGateCenterOffsets)
		{
			Vector2Int vector2Int5 = Direction.FromIndex(index);
			Vector2Int vector2Int6 = Direction.FromIndex(Direction.Clockwise(index));
			Vector2Int vector2Int7 = vector2Int5 * 3 + vector2Int6 * num7;
			Vector2Int coords3 = vector2Int + vector2Int7;
			if (GridUtils.CheckBounds(coords3, mapSize))
			{
				int num8 = GridUtils.CoordsToIndex(coords3, mapSize);
				if (elevationMap[num8] == elevation && obstacles[num8] == ObstacleState.Free && subzoneMap[num8] == subzoneTo && reachableMasks[subzoneTo][num8])
				{
					num2 = num8;
					break;
				}
			}
		}
		if (num2 == -1)
		{
			return result;
		}
		return new Gate(baseGate.subzoneFrom, baseGate.subzoneTo, baseGate.zoneFrom, baseGate.zoneTo, num, num2, positionFrom);
	}

	private static List<Gate> MergeRamps(List<Gate> potentialGates, Vector2Int mapSize)
	{
		List<Gate> list = new List<Gate>();
		Dictionary<int, Gate> dictionary = new Dictionary<int, Gate>();
		foreach (Gate potentialGate in potentialGates)
		{
			if (potentialGate.isValid && !dictionary.ContainsKey(potentialGate.positionFrom))
			{
				dictionary.Add(potentialGate.positionFrom, potentialGate);
			}
		}
		for (int i = 0; i < potentialGates.Count; i++)
		{
			Gate item = potentialGates[i];
			if (item.isRamp)
			{
				int num = 1;
				Vector2Int vector2Int = Direction.FromIndex(item.rampDirection);
				int neighbour = GridUtils.GetNeighbour(vector2Int, item.positionFrom, mapSize);
				if (neighbour >= 0 && dictionary.TryGetValue(neighbour, out var value) && value.isRamp && Direction.FromIndex(value.rampDirection) == vector2Int)
				{
					num++;
				}
				neighbour = GridUtils.GetNeighbour(vector2Int * 2, item.positionFrom, mapSize);
				if (neighbour >= 0 && dictionary.TryGetValue(neighbour, out var value2) && value2.isRamp && Direction.FromIndex(value2.rampDirection) == vector2Int)
				{
					num++;
				}
				item = new Gate(item.subzoneFrom, item.subzoneTo, item.zoneFrom, item.zoneTo, item.positionFrom, item.positionTo, item.rampPosition, num, item.elevation, item.guardZone, mapSize);
			}
			list.Add(item);
		}
		return list;
	}

	private static List<Gate> PickSubzoneGates(List<Gate> potentialGates, Vector2Int mapSize, bool[] gateFreeMap, int[] subzoneMap, System.Random random)
	{
		GeneratorException.ThrowIfFalse(potentialGates.Count > 0, "No potential gates found between subzones.", Log.Context.none);
		int subzoneFrom = potentialGates[0].subzoneFrom;
		int subzoneTo = potentialGates[0].subzoneTo;
		List<int> list = FindSubzoneBorderTiles(subzoneFrom, subzoneTo, subzoneMap, mapSize);
		int num = Mathf.CeilToInt((float)list.Count * 1f / 30f);
		List<Gate> list2 = new List<Gate>(num);
		List<Vector2> positionsFromTiles = Utils.GetPositionsFromTiles(list, mapSize);
		Vector2[] array = KMeans.Calculate(10, num, positionsFromTiles, random);
		RngUtils.Shuffle(array, random);
		for (int i = 0; i < num; i++)
		{
			Gate gate = SelectGateClosestToPoint(array[i], potentialGates, rampOk: true, -1, gateFreeMap, mapSize);
			if (!gate.isValid)
			{
				break;
			}
			ReserveGateSpace(gate, gateFreeMap, mapSize);
			list2.Add(gate);
		}
		return list2;
	}

	private static List<Gate> PickConnectionGates(Gate[] zoneGates, List<int> connectionIndices, List<Gate> potentialGates, List<Gate> potentialWideGates, Vector2Int mapSize, MapDescription mapDesc, bool[] gateFreeMap, ZoneMap zoneMap, ReadOnlyArray<Vector2> zonePositions, System.Random random)
	{
		GeneratorException.ThrowIfFalse(potentialGates.Count > 0, "No potential gates found between zones.", Log.Context.none);
		bool[] centerTaken = new bool[connectionIndices.Count];
		RngUtils.Shuffle(connectionIndices, random);
		connectionIndices.Sort(delegate(int a, int b)
		{
			MapDescription.Connection connection2 = mapDesc.connections[a];
			MapDescription.Connection connection3 = mapDesc.connections[b];
			int num4 = PlacementTypePriority(connection2.gatePlacement);
			int num5 = PlacementTypePriority(connection3.gatePlacement);
			if (num4 > num5)
			{
				return -1;
			}
			return (num5 > num4) ? 1 : 0;
		});
		byte zoneFrom = potentialGates[0].zoneFrom;
		byte zoneTo = potentialGates[0].zoneTo;
		List<int> tiles = FindZoneBorderTiles(zoneFrom, zoneTo, zoneMap, mapSize);
		List<Gate> list = new List<Gate>(connectionIndices.Count);
		List<Vector2> positionsFromTiles = Utils.GetPositionsFromTiles(tiles, mapSize);
		Vector2[] centers = KMeans.Calculate(10, connectionIndices.Count, positionsFromTiles, random);
		Vector2 centroid = Utils.Centroid(positionsFromTiles);
		for (int num = 0; num < connectionIndices.Count; num++)
		{
			int num2 = connectionIndices[num];
			MapDescription.Connection connection = mapDesc.connections[num2];
			Vector2? referencePoint = GetReferencePoint(connection.gatePlacement, connection.gatePlacementArgs);
			int num3 = GetClosestFreeCenter(referencePoint);
			Vector2 center = centroid;
			if (num3 != -1)
			{
				centerTaken[num3] = true;
				center = centers[num3];
			}
			bool flag = connection.connectionType == ConnectionType.GladiatorArena;
			bool rampOk = !flag;
			Gate gate = ((0 == 0) ? SelectGateClosestToPoint(center, potentialGates, rampOk, connection.guardZone, gateFreeMap, mapSize) : SelectGateClosestToPoint(center, potentialWideGates, rampOk, connection.guardZone, gateFreeMap, mapSize));
			if (!gate.isValid && flag)
			{
				throw new GeneratorException("Failed to place gladiator arena.", Log.Context.none);
			}
			if (gate.isValid)
			{
				ReserveGateSpace(gate, gateFreeMap, mapSize);
				list.Add(gate);
				zoneGates[num2] = gate;
			}
		}
		return list;
		int GetClosestFreeCenter(Vector2? vector)
		{
			float num4 = float.MaxValue;
			int result = -1;
			for (int i = 0; i < centers.Length; i++)
			{
				if (!centerTaken[i])
				{
					if (!vector.HasValue)
					{
						return i;
					}
					float sqrMagnitude = (vector.Value - centers[i]).sqrMagnitude;
					if (sqrMagnitude < num4)
					{
						num4 = sqrMagnitude;
						result = i;
					}
				}
			}
			return result;
		}
		Vector2? GetReferencePoint(GatePlacement placement, string[] args)
		{
			switch (placement)
			{
			case GatePlacement.Center:
				return centroid;
			case GatePlacement.NearZone:
			{
				int num4 = ParseNearZonePlacementRule(args, mapDesc);
				if (num4 >= 0)
				{
					return zonePositions[num4];
				}
				break;
			}
			}
			return null;
		}
		static int PlacementTypePriority(GatePlacement type)
		{
			return type switch
			{
				GatePlacement.Random => 0, 
				GatePlacement.Center => 2, 
				GatePlacement.NearZone => 1, 
				_ => 0, 
			};
		}
	}

	private static Gate SelectGateClosestToPoint(Vector2 center, List<Gate> potentialGates, bool rampOk, int guardZone, bool[] gateFreeMap, Vector2Int mapSize)
	{
		float num = float.MaxValue;
		int num2 = -1;
		for (int i = 0; i < potentialGates.Count; i++)
		{
			if (!DoesGateFit(potentialGates[i], gateFreeMap, mapSize))
			{
				continue;
			}
			Gate gate = potentialGates[i];
			if ((rampOk || !gate.isRamp) && (guardZone == -1 || gate.guardZone == guardZone))
			{
				Vector2 vector = GridUtils.IndexToPosition(gate.positionFrom, mapSize);
				float num3 = GateFitnessFunction((center - vector).sqrMagnitude, gate.isRamp, gate.rampWidth);
				if (num3 < num)
				{
					num2 = i;
					num = num3;
				}
			}
		}
		if (num2 >= 0)
		{
			return potentialGates[num2];
		}
		return default(Gate);
	}

	private static float GateFitnessFunction(float distance, bool isRamp, int rampWidth)
	{
		float num = distance;
		if (isRamp)
		{
			if (rampWidth == 2)
			{
				num = num * 2f + 0.05f;
			}
			if (rampWidth == 1)
			{
				num = num * 1.5f + 0.01f;
			}
		}
		return num;
	}

	private static void PlaceGate(Gate gateParams, bool reserveSpace, Vector2Int mapSize, ZoneMap zoneMap, int[] subZoneMap, sbyte[] elevation, ObstacleState[] obstacles, byte[] zoneOfSubzone)
	{
		if (gateParams.isWide)
		{
			PlaceGateWide(gateParams, mapSize, obstacles);
		}
		else if (gateParams.isRamp || !reserveSpace)
		{
			PlaceGateNormal(gateParams, mapSize, zoneMap, subZoneMap, elevation, obstacles, zoneOfSubzone);
		}
		else
		{
			PlaceReservedSpaceGate(gateParams, mapSize, obstacles);
		}
	}

	private static void PlaceGateNormal(Gate gateParams, Vector2Int mapSize, ZoneMap zoneMap, int[] subZoneMap, sbyte[] elevation, ObstacleState[] obstacles, byte[] zoneOfSubzone)
	{
		byte zone = zoneOfSubzone[gateParams.subzoneFrom];
		GridUtils.NeighboursIterator enumerator;
		if (gateParams.isRamp)
		{
			for (int i = 0; i < gateParams.rampWidth; i++)
			{
				int neighbour = GridUtils.GetNeighbour(Direction.FromIndex(gateParams.rampDirection) * i, gateParams.positionFrom, mapSize);
				if (subZoneMap[neighbour] == gateParams.subzoneFrom && elevation[neighbour] == gateParams.elevation)
				{
					continue;
				}
				zoneMap.Set(neighbour, zone);
				subZoneMap[neighbour] = gateParams.subzoneFrom;
				elevation[neighbour] = gateParams.elevation;
				obstacles[neighbour] = ObstacleState.Free;
				enumerator = GridUtils.GetNeighboursAll(neighbour, mapSize).GetEnumerator();
				while (enumerator.MoveNext())
				{
					int current = enumerator.Current;
					if (subZoneMap[current] != gateParams.subzoneFrom)
					{
						obstacles[current] = ObstacleState.Cliff;
					}
				}
			}
			for (int j = 0; j < gateParams.rampWidth; j++)
			{
				int neighbour2 = GridUtils.GetNeighbour(Direction.FromIndex(gateParams.rampDirection) * j, gateParams.rampPosition, mapSize);
				if (gateParams.rampWidth < 3)
				{
					obstacles[neighbour2] = ObstacleState.AlwaysFree;
					continue;
				}
				bool flag = j == 0 || j == gateParams.rampWidth - 1;
				obstacles[neighbour2] = (flag ? ObstacleState.Reserved : ObstacleState.AlwaysFree);
			}
			obstacles[gateParams.positionFrom] = ObstacleState.AlwaysFree;
			obstacles[gateParams.positionTo] = ObstacleState.AlwaysFree;
		}
		else
		{
			enumerator = GridUtils.GetNeighboursAll(gateParams.positionFrom, mapSize).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current2 = enumerator.Current;
				obstacles[current2] = ObstacleState.ReservedWalkable;
			}
			obstacles[gateParams.positionFrom] = ObstacleState.AlwaysFree;
			obstacles[gateParams.positionTo] = ObstacleState.AlwaysFree;
		}
		obstacles[gateParams.guardPosition] = ObstacleState.AlwaysFree;
		enumerator = GridUtils.GetNeighboursAll(gateParams.guardPosition, mapSize).GetEnumerator();
		while (enumerator.MoveNext())
		{
			int current3 = enumerator.Current;
			if (obstacles[current3] == ObstacleState.Free)
			{
				obstacles[current3] = ObstacleState.ReservedWalkable;
			}
		}
	}

	private static void PlaceReservedSpaceGate(Gate gateParams, Vector2Int mapSize, ObstacleState[] obstacles)
	{
		GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(gateParams.positionFrom, mapSize).GetEnumerator();
		while (enumerator.MoveNext())
		{
			int current = enumerator.Current;
			obstacles[current] = ObstacleState.ReservedWalkable;
		}
		obstacles[gateParams.positionFrom] = ObstacleState.AlwaysFree;
		obstacles[gateParams.positionTo] = ObstacleState.AlwaysFree;
	}

	private static void PlaceGateWide(Gate gateParams, Vector2Int mapSize, ObstacleState[] obstacles)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(gateParams.guardPosition, mapSize);
		for (int i = -2; i <= 2; i++)
		{
			for (int j = -2; j <= 2; j++)
			{
				int num = GridUtils.CoordsToIndex(vector2Int + new Vector2Int(i, j), mapSize);
				obstacles[num] = ObstacleState.Reserved;
			}
		}
		obstacles[gateParams.positionFrom] = ObstacleState.AlwaysFree;
		obstacles[gateParams.positionTo] = ObstacleState.AlwaysFree;
	}

	private static void FilterSubzoneMap(int[] subzoneMap, ZoneMap zoneMap, ObstacleState[] obstacles)
	{
		int[] array = new int[subzoneMap.Length];
		for (int i = 0; i < subzoneMap.Length; i++)
		{
			byte? b = zoneMap[i];
			int num = subzoneMap[i];
			ObstacleState state = obstacles[i];
			if (state.IsWalkable())
			{
				array[i] = num;
			}
			else
			{
				array[i] = -1;
			}
			if (b.HasValue && num == -1 && state.IsFreeForObstacles())
			{
				obstacles[i] = ObstacleState.AlwaysObstacle;
			}
		}
		for (int j = 0; j < subzoneMap.Length; j++)
		{
			subzoneMap[j] = array[j];
		}
	}

	private static void ReserveGateSpace(Gate gate, bool[] gateFreeMap, Vector2Int mapSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(gate.guardPosition, mapSize);
		int num = (gate.isWide ? 3 : 2);
		for (int i = -num; i <= num; i++)
		{
			for (int j = -num; j <= num; j++)
			{
				Vector2Int coords = vector2Int + new Vector2Int(i, j);
				if (GridUtils.CheckBounds(coords, mapSize))
				{
					int num2 = GridUtils.CoordsToIndex(coords, mapSize);
					gateFreeMap[num2] = true;
				}
			}
		}
	}

	private static bool DoesGateFit(Gate gate, bool[] gateFreeMap, Vector2Int mapSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(gate.guardPosition, mapSize);
		int num = (gate.isWide ? 3 : 2);
		for (int i = -num; i <= num; i++)
		{
			for (int j = -num; j <= num; j++)
			{
				Vector2Int coords = vector2Int + new Vector2Int(i, j);
				if (GridUtils.CheckBounds(coords, mapSize))
				{
					int num2 = GridUtils.CoordsToIndex(coords, mapSize);
					if (gateFreeMap[num2])
					{
						return false;
					}
				}
			}
		}
		return true;
	}

	private static List<int> FindZoneBorderTiles(byte zoneA, byte zoneB, ZoneMap zoneMap, Vector2Int mapSize)
	{
		List<int> list = new List<int>(50);
		for (int i = 0; i < zoneMap.Length; i++)
		{
			if (zoneMap[i] != zoneA)
			{
				continue;
			}
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(i, mapSize).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				if (zoneMap[current] == zoneB)
				{
					list.Add(i);
					break;
				}
			}
		}
		return list;
	}

	private static List<int> FindSubzoneBorderTiles(int subzoneA, int subzoneB, int[] subzoneMap, Vector2Int mapSize)
	{
		List<int> list = new List<int>(50);
		for (int i = 0; i < subzoneMap.Length; i++)
		{
			if (subzoneMap[i] != subzoneA)
			{
				continue;
			}
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(i, mapSize).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				if (subzoneMap[current] == subzoneB)
				{
					list.Add(i);
					break;
				}
			}
		}
		return list;
	}

	private static int ParseNearZonePlacementRule(string[] args, MapDescription mapDesc)
	{
		if (Utils.IsArrayNullOrEmpty(args))
		{
			Log.ConfigError(GetErrorText(mapDesc.name, "zone not specified"));
			return -1;
		}
		string refZoneName = args[0];
		int num = mapDesc.zones.FindIndex((MapDescription.Zone z) => z.name == refZoneName);
		if (num < 0)
		{
			Log.ConfigError(GetErrorText(mapDesc.name, "zone '" + refZoneName + "' doesn't exist"));
			return -1;
		}
		return num;
	}

	private static string GetErrorText(string template, string error)
	{
		return "Failed to apply a placement rule to a connection in template '" + template + "': " + error + ".";
	}
}
