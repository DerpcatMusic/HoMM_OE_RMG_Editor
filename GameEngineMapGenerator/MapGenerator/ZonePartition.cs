using System;
using System.Collections.Generic;
using System.Globalization;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public static class ZonePartition
{
	private struct UniformPlacementData
	{
		public bool isCenter;

		public float offset;

		public float noise;

		public UniformPlacementData(bool isCenter, float offset, float noise)
		{
			this.isCenter = isCenter;
			this.offset = offset;
			this.noise = noise;
		}
	}

	private struct MainObjectsPositioning
	{
		public Vector2[] referencePositions;

		public List<Vector2> fixedPartitionPoints;
	}

	private static ProfilerMarker ProfilerMarker = new ProfilerMarker("ComputePartitions");

	public static void ComputePartitions(out PartitionData[] partition, ObstacleState[] obstaclesMap, int zoneCount, int subzoneCount, MapDescription mapDesc, EncounterTemplatesDatabase encounterDB, Vector2Int mapSize, System.Random random, ReadOnlyArray<Gate> gates, ZoneMap zoneMap, ReadOnlyArray<int> subzoneMap, ReadOnlyArray<Vector2> zonePositions)
	{
		partition = new PartitionData[zoneCount];
		List<int>[] array = new List<int>[zoneCount];
		List<Vector2>[] array2 = new List<Vector2>[zoneCount];
		List<int>[] array3 = new List<int>[subzoneCount];
		List<int>[] array4 = new List<int>[subzoneCount];
		for (int i = 0; i < zoneCount; i++)
		{
			array[i] = new List<int>();
			array4[i] = new List<int>();
		}
		for (int j = 0; j < subzoneCount; j++)
		{
			array3[j] = new List<int>();
		}
		for (int k = 0; k < mapSize.x * mapSize.y; k++)
		{
			int num = subzoneMap[k];
			if (num != -1)
			{
				byte? b = zoneMap[k];
				if (b.HasValue)
				{
					array[b.Value].Add(k);
					array3[num].Add(k);
				}
			}
		}
		for (int l = 0; l < zoneCount; l++)
		{
			array2[l] = Utils.GetPositionsFromTiles(array[l], mapSize);
		}
		for (int m = 0; m < subzoneCount; m++)
		{
			byte value = zoneMap[array3[m][0]].Value;
			array4[value].Add(m);
		}
		ObstacleState[] array5 = new ObstacleState[obstaclesMap.Length];
		for (int n = 0; n < obstaclesMap.Length; n++)
		{
			if (!obstaclesMap[n].IsFreeForEncounter())
			{
				array5[n] = obstaclesMap[n];
				continue;
			}
			GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(n, mapSize).GetEnumerator();
			while (enumerator.MoveNext())
			{
				int current = enumerator.Current;
				if (!obstaclesMap[current].IsFreeForEncounter())
				{
					array5[n] = ObstacleState.ReservedWalkable;
					break;
				}
			}
		}
		for (byte b2 = 0; b2 < zoneCount; b2++)
		{
			List<Vector2> list = array2[b2];
			int roadClusterArea = mapDesc.zones[b2].layout.roadClusterArea;
			Vector2 centroid = Utils.Centroid(list);
			MainObjectsPositioning mainObjects = ComputeMainObjectPositioning(b2, list, centroid, mapDesc, zonePositions, gates, random, mapSize);
			int minClusterCount = mapDesc.zones[b2].mainObjects.Count + 1;
			Vector2[] centers = FindClusters(roadClusterArea, minClusterCount, array4[b2], array3, mainObjects, subzoneMap, random, mapSize);
			partition[b2] = PlaceKeypoints(b2, centroid, centers, mainObjects.referencePositions, zoneMap, obstaclesMap, array5, mapDesc, encounterDB, mapSize, random);
		}
		CalculateZoneAreas(partition, obstaclesMap, zoneMap);
	}

	private static Vector2[] FindClusters(int districtArea, int minClusterCount, List<int> subzones, List<int>[] subzoneTiles, MainObjectsPositioning mainObjects, ReadOnlyArray<int> subzoneMap, System.Random random, Vector2Int mapSize)
	{
		List<Vector2> list = new List<Vector2>();
		List<Vector2> list2 = new List<Vector2>();
		int num = 0;
		foreach (int subzone in subzones)
		{
			num += subzoneTiles[subzone].Count;
		}
		foreach (int subzone2 in subzones)
		{
			List<int> list3 = subzoneTiles[subzone2];
			List<Vector2> positionsFromTiles = Utils.GetPositionsFromTiles(list3, mapSize);
			list2.Clear();
			foreach (Vector2 fixedPartitionPoint in mainObjects.fixedPartitionPoints)
			{
				int index = GridUtils.PositionToIndex(fixedPartitionPoint, mapSize);
				if (subzoneMap[index] == subzone2)
				{
					list2.Add(fixedPartitionPoint);
				}
			}
			int num2 = Mathf.Max(3, Mathf.CeilToInt((float)list3.Count / (float)num * (float)minClusterCount));
			int meansCount = Mathf.Max(b: Mathf.RoundToInt((float)list3.Count / (float)districtArea), a: num2 + list2.Count);
			Vector2[] collection = KMeans.Calculate(25, meansCount, positionsFromTiles, random, list2, list2.Count);
			list.AddRange(collection);
		}
		return list.ToArray();
	}

	private static MainObjectsPositioning ComputeMainObjectPositioning(byte zoneID, List<Vector2> zoneTilePositions, Vector2 centroid, MapDescription mapDesc, ReadOnlyArray<Vector2> zonePositions, ReadOnlyArray<Gate> gates, System.Random random, Vector2Int mapSize)
	{
		MapDescription.Zone zone = mapDesc.zones[zoneID];
		MainObjectsPositioning result = new MainObjectsPositioning
		{
			referencePositions = new Vector2[zone.mainObjects.Count],
			fixedPartitionPoints = new List<Vector2>()
		};
		if (zone.mainObjects.Count == 0)
		{
			return result;
		}
		UniformPlacementData[] array = new UniformPlacementData[zone.mainObjects.Count];
		bool flag = false;
		List<Vector2> list = new List<Vector2>();
		for (int i = 0; i < zone.mainObjects.Count; i++)
		{
			MapDescription.MainObject mainObject = zone.mainObjects[i];
			switch (mainObject.placement)
			{
			case MainObjectPlacement.Center:
				result.referencePositions[i] = centroid;
				flag = true;
				break;
			case MainObjectPlacement.Connection:
			{
				if (ParseConnectionPlacementRule(out var position2, mainObject.placementArgs, mapDesc, gates, zoneID, mapSize))
				{
					Vector2 vector = GridUtils.IndexToPosition(position2, mapSize);
					result.referencePositions[i] = vector;
				}
				break;
			}
			case MainObjectPlacement.Uniform:
				array[i] = ParseUniformPlacementRule(mainObject.placementArgs, zone.name);
				break;
			case MainObjectPlacement.NearZone:
			{
				if (ParseNearZonePlacementRule(out var position, mainObject.placementArgs, mapDesc, zoneID, zonePositions))
				{
					result.referencePositions[i] = position;
				}
				break;
			}
			}
		}
		if (flag)
		{
			result.fixedPartitionPoints.Add(centroid);
			list.Add(centroid);
		}
		Vector2[] array2 = KMeans.Calculate(15, zone.mainObjects.Count, zoneTilePositions, random, list, list.Count);
		List<Vector2>[] array3 = FindDomains(array2, zoneTilePositions);
		List<(Vector2, int)> list2 = new List<(Vector2, int)>();
		for (int j = list.Count; j < array2.Length; j++)
		{
			list2.Add((array2[j], j));
		}
		list2.Sort(((Vector2 pos, int ind) a, (Vector2 pos, int ind) b) => (a.pos - centroid).sqrMagnitude.CompareTo((b.pos - centroid).sqrMagnitude));
		int num = 0;
		for (int num2 = 0; num2 < zone.mainObjects.Count; num2++)
		{
			if (zone.mainObjects[num2].placement == MainObjectPlacement.Uniform)
			{
				UniformPlacementData data = array[num2];
				if (data.isCenter)
				{
					(Vector2, int) tuple = list2[num];
					Vector2 item = tuple.Item1;
					int item2 = tuple.Item2;
					List<Vector2> domain = array3[item2];
					item = AdjustUniformPosition(item, centroid, domain, data, mapSize, random);
					result.fixedPartitionPoints.Add(item);
					result.referencePositions[num2] = item;
					num++;
				}
			}
		}
		for (int num3 = 0; num3 < zone.mainObjects.Count; num3++)
		{
			if (zone.mainObjects[num3].placement == MainObjectPlacement.Uniform)
			{
				UniformPlacementData data2 = array[num3];
				if (!data2.isCenter)
				{
					(Vector2, int) tuple2 = list2[num];
					Vector2 item3 = tuple2.Item1;
					int item4 = tuple2.Item2;
					List<Vector2> domain2 = array3[item4];
					item3 = AdjustUniformPosition(item3, centroid, domain2, data2, mapSize, random);
					result.fixedPartitionPoints.Add(item3);
					result.referencePositions[num3] = item3;
					num++;
				}
			}
		}
		return result;
	}

	private static List<Vector2>[] FindDomains(Vector2[] centers, List<Vector2> positions)
	{
		List<Vector2>[] array = new List<Vector2>[centers.Length];
		for (int i = 0; i < centers.Length; i++)
		{
			array[i] = new List<Vector2>();
		}
		foreach (Vector2 position in positions)
		{
			float num = float.MaxValue;
			int num2 = -1;
			for (int j = 0; j < centers.Length; j++)
			{
				float sqrMagnitude = (position - centers[j]).sqrMagnitude;
				if (sqrMagnitude < num)
				{
					num = sqrMagnitude;
					num2 = j;
				}
			}
			array[num2].Add(position);
		}
		return array;
	}

	private static Vector2 AdjustUniformPosition(Vector2 center, Vector2 centroid, List<Vector2> domain, UniformPlacementData data, Vector2Int mapSize, System.Random random)
	{
		Vector2 a = Vector2.zero;
		if (data.offset < 0f)
		{
			Vector2 lhs = center - centroid;
			float num = 0f;
			float num2 = Mathf.Clamp01(0f - data.offset) * 10f;
			foreach (Vector2 item in domain)
			{
				Vector2 rhs = item - center;
				float num3 = Vector2.Dot(lhs, rhs);
				float num4 = 1f;
				if (num3 > 0f)
				{
					num4 += num2;
				}
				num += num4;
				a += item * num4;
			}
			a /= num;
		}
		else
		{
			a = center;
		}
		return Vector2.Lerp(a, centroid, Mathf.Clamp01(data.offset)) + MainObjectPosiitonNoise(data.noise, mapSize, random);
	}

	private static Vector2 MainObjectPosiitonNoise(float noise, Vector2Int mapSize, System.Random random)
	{
		float f = (float)random.NextDouble() * (float)Math.PI * 2f;
		float num = noise * (float)random.NextDouble();
		Vector2 result = new Vector2(Mathf.Cos(f), Mathf.Sin(f)) * num;
		result.x /= mapSize.x;
		result.y /= mapSize.y;
		return result;
	}

	private static PartitionData PlaceKeypoints(byte zoneID, Vector2 centroid, Vector2[] centers, Vector2[] mainObjectPositions, ZoneMap zoneMap, ObstacleState[] obstaclesMap, ObstacleState[] obstaclesMapMainObjects, MapDescription mapDesc, EncounterTemplatesDatabase encounterDB, Vector2Int mapSize, System.Random random)
	{
		PartitionData partitionData = new PartitionData();
		MapDescription.Zone zone = mapDesc.zones[zoneID];
		GeneratorException.ThrowIfFalse(centers.Length >= zone.mainObjects.Count + 1, "Too few partition points in a zone.", Log.Context.ZoneIndex(zoneID));
		partitionData.mainObjectEncounters = new Encounter[zone.mainObjects.Count];
		int[] array = new int[zone.mainObjects.Count];
		Utils.FillArray(array, -1);
		bool[] array2 = new bool[centers.Length];
		List<int> list = new List<int>();
		AvailableRects availableRects = new AvailableRects(7);
		int num = -1;
		bool flag = zone.crossroadsPosition >= 0 && zone.crossroadsPosition < zone.mainObjects.Count;
		if (zone.crossroadsPosition != -1 && !flag)
		{
			Log.ConfigError("Template '" + mapDesc.name + "', zone '" + zone.name + "': crossroads main object index is out of range.");
		}
		for (int i = 0; i < zone.mainObjects.Count; i++)
		{
			MapDescription.MainObject mainObject = zone.mainObjects[i];
			if (array[i] != -1)
			{
				continue;
			}
			bool val = false;
			Vector2 referencePosition = mainObjectPositions[i];
			PositionPicker.SortBy(list, centers.Length, (int a, int b) => (centers[a] - referencePosition).sqrMagnitude.CompareTo((centers[b] - referencePosition).sqrMagnitude));
			foreach (int item in list)
			{
				if (!array2[item] && TryPlaceMainObjectSlot(out var encounter, mainObject.type, centers[item], zoneID, encounterDB, availableRects, zoneMap, obstaclesMap, obstaclesMapMainObjects, random, mapSize))
				{
					val = true;
					array2[item] = true;
					array[i] = item;
					partitionData.mainObjectEncounters[i] = encounter;
					break;
				}
			}
			GeneratorException.ThrowIfFalse(val, "Failed to place a main object.", Log.Context.ZoneIndex(zoneID));
		}
		Vector2 mainObjectPosition;
		if (flag)
		{
			mainObjectPosition = centers[array[zone.crossroadsPosition]];
			PositionPicker.SortBy(list, centers.Length, (int a, int b) => CrossroadsCompareValue(a).CompareTo(CrossroadsCompareValue(b)));
			foreach (int item2 in list)
			{
				if (!array2[item2])
				{
					int num2 = FindFreeTile(centers[item2], zoneID, zoneMap, obstaclesMap, mapSize);
					if (num2 >= 0)
					{
						num = num2;
						array2[item2] = true;
						obstaclesMap[num] = ObstacleState.AlwaysFree;
						break;
					}
				}
			}
			GeneratorException.ThrowIfFalse(num >= 0, "Failed to place the crossroads.", Log.Context.ZoneIndex(zoneID));
		}
		else
		{
			PositionPicker.SortBy(list, centers.Length, (int a, int b) => (centers[a] - centroid).sqrMagnitude.CompareTo((centers[b] - centroid).sqrMagnitude));
			foreach (int item3 in list)
			{
				if (!array2[item3])
				{
					int num3 = FindFreeTile(centers[item3], zoneID, zoneMap, obstaclesMap, mapSize);
					if (num3 >= 0)
					{
						num = num3;
						array2[item3] = true;
						obstaclesMap[num] = ObstacleState.AlwaysFree;
						obstaclesMapMainObjects[num] = ObstacleState.AlwaysFree;
						break;
					}
				}
			}
			GeneratorException.ThrowIfFalse(num >= 0, "Failed to place the crossroads.", Log.Context.ZoneIndex(zoneID));
		}
		List<int> list2 = new List<int>();
		list2.Add(num);
		for (int num4 = 0; num4 < centers.Length; num4++)
		{
			if (!array2[num4])
			{
				int num5 = FindFreeTile(centers[num4], zoneID, zoneMap, obstaclesMap, mapSize);
				if (num5 >= 0)
				{
					list2.Add(num5);
				}
			}
		}
		partitionData.crossroads = num;
		partitionData.keypoints = list2.ToArray();
		return partitionData;
		float CrossroadsCompareValue(int index)
		{
			Vector2 rhs = centers[index] - mainObjectPosition;
			float num6 = Mathf.Max(Vector2.Dot(centroid - mainObjectPosition, rhs), 0f);
			return rhs.sqrMagnitude + -1f * num6;
		}
	}

	private static int FindFreeTile(Vector2 position, byte zoneID, ZoneMap zoneMap, ObstacleState[] obstaclesMap, Vector2Int size)
	{
		Vector2Int vector2Int = GridUtils.PositionToCoords(position, size);
		int x = vector2Int.x;
		int y = vector2Int.y;
		for (int i = 0; i <= 2; i++)
		{
			for (int j = x - i; j <= x + i; j++)
			{
				int num = ((j == x - i || j == x + i) ? 1 : (i * 2));
				for (int k = y - i; k <= y + i; k += num)
				{
					Vector2Int coords = new Vector2Int(j, k);
					if (GridUtils.CheckBounds(coords, size))
					{
						int num2 = GridUtils.CoordsToIndex(coords, size);
						if (zoneMap.GetPlayableZoneRaw(num2) == zoneID && obstaclesMap[num2] == ObstacleState.Free)
						{
							return num2;
						}
					}
				}
			}
		}
		return -1;
	}

	private static bool TryPlaceMainObjectSlot(out Encounter encounter, MainObjectType mainObjectType, Vector2 position, byte zoneID, EncounterTemplatesDatabase encounterDB, AvailableRects availableRects, ZoneMap zoneMap, ObstacleState[] obstaclesMap, ObstacleState[] obstaclesMapMainObjects, System.Random random, Vector2Int size)
	{
		EncounterTemplatesDatabase.Group obj = null;
		switch (mainObjectType)
		{
		case MainObjectType.City:
			obj = encounterDB.GetCityGroup();
			break;
		case MainObjectType.Spawn:
			obj = encounterDB.GetCityGroup();
			break;
		case MainObjectType.AbandonedOutpost:
			obj = encounterDB.GetCityGroup();
			break;
		case MainObjectType.GladiatorArena:
			obj = encounterDB.GetGladiatorArenaGroup();
			break;
		}
		obj.ShuffleFootprints(random);
		Vector2Int vector2Int = GridUtils.PositionToCoords(position, size);
		int x = vector2Int.x;
		int y = vector2Int.y;
		for (int i = 0; i <= 3; i++)
		{
			for (int j = x - i; j <= x + i; j++)
			{
				int num = ((j == x - i || j == x + i) ? 1 : (i * 2));
				for (int k = y - i; k <= y + i; k += num)
				{
					Vector2Int coords = new Vector2Int(j, k);
					if (!GridUtils.CheckBounds(coords, size))
					{
						continue;
					}
					int num2 = GridUtils.CoordsToIndex(coords, size);
					if (zoneMap.GetPlayableZoneRaw(num2) == zoneID)
					{
						availableRects.BuildAt(num2, obstaclesMapMainObjects, size, -3);
						if (obj.TryPickFootprint(out var footprint, availableRects))
						{
							EncounterTemplate encounterTemplate = obj.PickRandomTemplateForFootprint(footprint, random);
							encounter = new Encounter(encounterTemplate, num2, footprint, 0, 0, size);
							ReserveSpaceAroundEncounter(obstaclesMapMainObjects, num2, encounterTemplate.width, encounterTemplate.height, size);
							EncounterUtils.SetObstaclesByTemplate(obstaclesMapMainObjects, encounter.position, encounter.entrance, encounter.template, size);
							EncounterUtils.SetObstaclesByTemplate(obstaclesMap, encounter.position, encounter.entrance, encounter.template, size);
							return true;
						}
					}
				}
			}
		}
		encounter = default(Encounter);
		return false;
	}

	private static void ReserveSpaceAroundEncounter(ObstacleState[] map, int tile, int width, int height, Vector2Int mapSize)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(tile, mapSize);
		int num = Mathf.Max(vector2Int.x - 1, 0);
		int num2 = Mathf.Max(vector2Int.y - 1, 0);
		int num3 = Mathf.Min(vector2Int.x + width, mapSize.x);
		int num4 = Mathf.Min(vector2Int.y + height, mapSize.y);
		for (int i = num; i < num3; i++)
		{
			for (int j = num2; j < num4; j++)
			{
				map[i + j * mapSize.x] = ObstacleState.NoEncounters;
			}
		}
	}

	private static void CalculateZoneAreas(PartitionData[] partitionDatas, ObstacleState[] obstaclesMap, ZoneMap zoneMap)
	{
		for (int i = 0; i < obstaclesMap.Length; i++)
		{
			byte? b = zoneMap[i];
			if (b.HasValue)
			{
				partitionDatas[b.Value].area++;
			}
		}
	}

	private static UniformPlacementData ParseUniformPlacementRule(string[] args, string zoneName)
	{
		bool isCenter = false;
		float result = 0f;
		float result2 = 0f;
		if (args == null || args.Length == 0)
		{
			return default(UniformPlacementData);
		}
		switch (args[0])
		{
		case "true":
			isCenter = true;
			break;
		case "false":
			isCenter = false;
			break;
		default:
			Log.ConfigError(GetErrorText(zoneName, "'" + args[0] + "' wrong argument."));
			break;
		}
		if (args.Length > 1 && !float.TryParse(args[1], NumberStyles.Float, CultureInfo.InvariantCulture, out result))
		{
			Log.ConfigError(GetErrorText(zoneName, "'" + args[1] + "' wrong argument."));
		}
		if (args.Length > 2 && !float.TryParse(args[2], NumberStyles.Float, CultureInfo.InvariantCulture, out result2))
		{
			Log.ConfigError(GetErrorText(zoneName, "'" + args[2] + "' wrong argument."));
		}
		return new UniformPlacementData(isCenter, result, result2);
	}

	private static bool ParseConnectionPlacementRule(out int position, string[] args, MapDescription mapDesc, ReadOnlyArray<Gate> gates, byte zoneID, Vector2Int mapSize)
	{
		string name = mapDesc.zones[zoneID].name;
		position = -1;
		if (Utils.IsArrayNullOrEmpty(args))
		{
			Log.ConfigError(GetErrorText(name, "connection not specified"));
			return false;
		}
		string connectionName = args[0];
		int num = mapDesc.connections.FindIndex((MapDescription.Connection c) => c.name == connectionName);
		if (num < 0)
		{
			Log.ConfigError(GetErrorText(name, "connection '" + connectionName + "' doesn't exist"));
			return false;
		}
		if (!mapDesc.connections[num].connectionType.NeedsGroundConnection())
		{
			Log.ConfigError(GetErrorText(name, "connection '" + connectionName + "' is not a ground connection"));
			return false;
		}
		MapDescription.Connection connection = mapDesc.connections[num];
		if (connection.from != zoneID && connection.to != zoneID)
		{
			Log.ConfigError(GetErrorText(name, "connection '" + connectionName + "' is not connected to the zone."));
			return false;
		}
		Gate gate = gates[num];
		if (!gate.isValid)
		{
			Log.ConfigError(GetErrorText(name, "connection '" + connectionName + "' is a portal"));
			return false;
		}
		if (gate.zoneFrom == zoneID)
		{
			position = gate.GetRoadPointFrom(mapSize);
		}
		else
		{
			position = gate.GetRoadPointTo(mapSize);
		}
		return true;
	}

	private static bool ParseNearZonePlacementRule(out Vector2 position, string[] args, MapDescription mapDesc, byte zoneID, ReadOnlyArray<Vector2> zonePositions)
	{
		string name = mapDesc.zones[zoneID].name;
		position = Vector2.zero;
		if (Utils.IsArrayNullOrEmpty(args))
		{
			Log.ConfigError(GetErrorText(name, "zone not specified"));
			return false;
		}
		string refZoneName = args[0];
		int num = mapDesc.zones.FindIndex((MapDescription.Zone z) => z.name == refZoneName);
		if (num < 0)
		{
			Log.ConfigError(GetErrorText(name, "zone '" + refZoneName + "' doesn't exist"));
			return false;
		}
		position = zonePositions[num];
		return true;
	}

	private static string GetErrorText(string zoneName, string error)
	{
		return "Failed to apply a placement rule to a main object in zone '" + zoneName + "': " + error + ".";
	}
}
