using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class PlacementRuleHandler
{
	private class DistanceMap
	{
		private float[] distances;

		private int zoneID;

		public float this[int index]
		{
			get
			{
				return distances[index];
			}
			set
			{
				distances[index] = value;
			}
		}

		public DistanceMap(int tile, WalkablePoints points, Pathfinder<MoveCost> pathfinder, int zoneID)
		{
			this.zoneID = zoneID;
			pathfinder.FindCostsToAll(tile, out var costs);
			InitDistances(points, costs);
		}

		public DistanceMap(List<int> tiles, WalkablePoints points, Pathfinder<MoveCost> pathfinder)
		{
			pathfinder.FindCostsToAll(tiles, out var costs);
			InitDistances(points, costs);
		}

		private void InitDistances(WalkablePoints points, MoveCost[] costs)
		{
			distances = new float[points.TileCount];
			float num = 0f;
			float num2 = float.MaxValue;
			for (int i = 0; i < points.TileCount; i++)
			{
				MoveCost moveCost = costs[points.Tiles[i]];
				GeneratorException.ThrowIfFalse(moveCost.g < int.MaxValue, "Failed to find path to a point.", Log.Context.ZoneIndex(zoneID));
				distances[i] = moveCost.g;
				if ((float)moveCost.g > num)
				{
					num = moveCost.g;
				}
				if ((float)moveCost.g < num2)
				{
					num2 = moveCost.g;
				}
			}
			float num3 = 1f;
			if (num > num2)
			{
				num3 = 1f / (num - num2);
			}
			for (int j = 0; j < points.TileCount; j++)
			{
				distances[j] = (distances[j] - num2) * num3;
			}
		}
	}

	private struct MoveCost : IComparable<MoveCost>
	{
		public readonly int g;

		public readonly int h;

		public int FCost => g + h;

		public MoveCost(int g, int h)
		{
			this.g = g;
			this.h = h;
		}

		public int CompareTo(MoveCost other)
		{
			if (FCost == other.FCost)
			{
				return g.CompareTo(other.g);
			}
			return FCost.CompareTo(other.FCost);
		}
	}

	private class CostCalculator : IPathfinderCostCalculator<MoveCost>
	{
		private Vector2Int size;

		public MoveCost MaxCost => new MoveCost(int.MaxValue, 0);

		public MoveCost MinCost => new MoveCost(0, 0);

		public CostCalculator(Vector2Int size)
		{
			this.size = size;
		}

		public MoveCost CostToNeighbour(MoveCost currentCost, int current, int neighbour, int target)
		{
			Vector2Int vector2Int = GridUtils.IndexToCoords(current, size);
			Vector2Int vector2Int2 = GridUtils.IndexToCoords(neighbour, size);
			Vector2Int vector2Int3 = GridUtils.IndexToCoords(target, size);
			int num = Mathf.Abs(vector2Int.x - vector2Int2.x);
			int num2 = Mathf.Abs(vector2Int.y - vector2Int2.y);
			int num3 = 10;
			if (num > 0 && num2 > 0)
			{
				num3 = 14;
			}
			int h = Mathf.FloorToInt((vector2Int2 - vector2Int3).magnitude * 10f);
			return new MoveCost(currentCost.g + num3, h);
		}
	}

	private WalkablePoints walkablePoints;

	private PartitionData partitionData;

	private MapDescription mapDesc;

	private ZoneMap zoneMap;

	private ReadOnlyArray<Gate> gates;

	private List<Encounter> portals;

	private int[] portalByConnection;

	private int zoneID;

	private Vector2Int mapSize;

	private int[] encounterEntranceByMandatoryContent;

	private byte[] roadMap;

	private Pathfinder<MoveCost> pathfinder;

	private List<float> weights = new List<float>();

	private List<Vector2> referencePositions = new List<Vector2>();

	private List<float> tempDistances = new List<float>();

	private Dictionary<int, DistanceMap> distanceFromTile = new Dictionary<int, DistanceMap>();

	private DistanceMap roadDistanceMap;

	private bool zoneHasRoads = true;

	public PlacementRuleHandler(WalkablePoints walkablePoints, MapDescription mapDesc, PartitionData partitionData, int zoneID, Vector2Int mapSize, ZoneMap zoneMap, ReadOnlyArray<ObstacleState> obstacles, ReadOnlyArray<Gate> gates, List<Encounter> portals, int[] portalByConnection, byte[] roadMap)
	{
		this.walkablePoints = walkablePoints;
		this.partitionData = partitionData;
		this.zoneID = zoneID;
		this.mapSize = mapSize;
		this.mapDesc = mapDesc;
		this.zoneMap = zoneMap;
		this.gates = gates;
		this.portals = portals;
		this.portalByConnection = portalByConnection;
		this.roadMap = roadMap;
		Func<int, bool> isWalkable = (int index) => obstacles[index].IsWalkable() && zoneMap[index] == zoneID;
		GridNeighboursGetter neighboursGetter = new GridNeighboursGetter(mapSize, isWalkable);
		CostCalculator costCalculator = new CostCalculator(mapSize);
		pathfinder = new Pathfinder<MoveCost>(mapSize.x * mapSize.y, neighboursGetter, costCalculator);
		encounterEntranceByMandatoryContent = new int[mapDesc.zones[zoneID].mandatoryContent.Count];
		Utils.FillArray(encounterEntranceByMandatoryContent, -1);
	}

	public WalkablePoints.Iterator SortPoints(List<MapDescription.PlacementRule> rules, System.Random random)
	{
		if (rules.Count == 0)
		{
			walkablePoints.Shuffle(random);
			return walkablePoints.GetIterator();
		}
		List<int> lookupOrder = walkablePoints.LookupOrder;
		weights.Clear();
		lookupOrder.Clear();
		for (int i = 0; i < walkablePoints.TileCount; i++)
		{
			float item = (float)random.NextDouble() * 0.01f;
			weights.Add(item);
			lookupOrder.Add(i);
		}
		foreach (MapDescription.PlacementRule rule in rules)
		{
			ProcessRule(rule, random);
		}
		lookupOrder.Sort((int a, int b) => weights[a].CompareTo(weights[b]));
		return walkablePoints.GetIterator();
	}

	public void SetMandatoryContentPosition(int contentIndex, int position)
	{
		encounterEntranceByMandatoryContent[contentIndex] = position;
	}

	public void UpdateRoads()
	{
		roadDistanceMap = null;
		zoneHasRoads = true;
	}

	public static bool TryParseRule(PlacementRule rule, MapDescription desc, int zoneIndex, out MapDescription.PlacementRule result)
	{
		result = default(MapDescription.PlacementRule);
		if (!EnumParser.TryParceEnum<PlacementRuleType>(rule.type, out result.type))
		{
			Log.ConfigError("Couldn't parse rule type '" + rule.type + "' in template '" + desc.name + "'.");
			return false;
		}
		result.target = rule.target;
		result.targetMin = rule.targetMin;
		result.targetMax = rule.targetMax;
		result.weight = rule.weight;
		string name = desc.zones[zoneIndex].name;
		switch (result.type)
		{
		case PlacementRuleType.Random:
			return true;
		case PlacementRuleType.Sid:
			return TryParseSidRule(out result.sid, rule.args, name);
		case PlacementRuleType.MainObject:
		{
			if (RuleParseUtils.TryParseMainObjectIndex(out result.mainObjectIndex, out var error2, rule.args, 0, desc.zones[zoneIndex].mainObjects.Count))
			{
				return true;
			}
			Log.ConfigError(GetErrorText(name, error2));
			return false;
		}
		case PlacementRuleType.Crossroads:
			return true;
		case PlacementRuleType.Connection:
		{
			if (RuleParseUtils.TryParseConnectionIndex(out result.connectionIndex, out var error3, rule.args, 0, desc, zoneIndex))
			{
				return true;
			}
			Log.ConfigError(GetErrorText(name, error3));
			return false;
		}
		case PlacementRuleType.Road:
			return true;
		case PlacementRuleType.MandatoryContent:
		{
			if (RuleParseUtils.TryParseMandatoryContentIndex(out result.mandatoryContentIndex, out var error, rule.args, 0, desc.zones[zoneIndex].mandatoryContent, zoneIndex))
			{
				return true;
			}
			Log.ConfigError(GetErrorText(name, error));
			return false;
		}
		default:
			return false;
		}
	}

	private DistanceMap GetDistanceMap(int position)
	{
		if (!distanceFromTile.TryGetValue(position, out var value))
		{
			value = new DistanceMap(position, walkablePoints, pathfinder, zoneID);
			distanceFromTile[position] = value;
		}
		return value;
	}

	private void ProcessRule(MapDescription.PlacementRule rule, System.Random random)
	{
		switch (rule.type)
		{
		case PlacementRuleType.Random:
			RandomRule(rule, random);
			break;
		case PlacementRuleType.Sid:
			SidRule(rule, random);
			break;
		case PlacementRuleType.MainObject:
			MainObjectRule(rule, random);
			break;
		case PlacementRuleType.Crossroads:
			CrossroadsRule(rule, random);
			break;
		case PlacementRuleType.Connection:
			ConnectionRule(rule, random);
			break;
		case PlacementRuleType.Road:
			RoadRule(rule, random);
			break;
		case PlacementRuleType.MandatoryContent:
			MandatoryContentRule(rule, random);
			break;
		}
	}

	private static float ResolveTarget(MapDescription.PlacementRule rule, System.Random random)
	{
		if (rule.targetMax >= rule.targetMin && rule.targetMax > 0f)
		{
			return Mathf.Clamp01(RngUtils.GetFloatInRage(rule.targetMin, rule.targetMax, random));
		}
		return Mathf.Clamp01(rule.target);
	}

	private static float ApplyTarget(float value, float target)
	{
		return Mathf.Abs(value - target);
	}

	private void RandomRule(MapDescription.PlacementRule rule, System.Random random)
	{
		for (int i = 0; i < walkablePoints.BucketCount; i++)
		{
			float num = rule.weight * (float)random.NextDouble();
			int num2 = walkablePoints.BucketBegin(i);
			int num3 = walkablePoints.BucketEnd(i);
			for (int j = num2; j < num3; j++)
			{
				weights[j] += num;
			}
		}
	}

	private void SidRule(MapDescription.PlacementRule rule, System.Random random)
	{
		List<MapObjectDesc> list = mapDesc.contentTask.mandatory[zoneID];
		referencePositions.Clear();
		for (int i = 0; i < list.Count; i++)
		{
			int num = encounterEntranceByMandatoryContent[i];
			if (num >= 0 && !(list[i].Sid != rule.sid))
			{
				referencePositions.Add(GridUtils.IndexToPosition(num, mapSize));
			}
		}
		if (referencePositions.Count == 0)
		{
			return;
		}
		tempDistances.Clear();
		float num2 = 0f;
		float num3 = float.MaxValue;
		for (int j = 0; j < walkablePoints.BucketCount; j++)
		{
			float num4 = float.MaxValue;
			Vector2 vector = walkablePoints.BucketCenterPositions[j];
			for (int k = 0; k < referencePositions.Count; k++)
			{
				num4 = Mathf.Min(num4, (vector - referencePositions[k]).magnitude);
			}
			if (num4 < num3)
			{
				num3 = num4;
			}
			if (num4 > num2)
			{
				num2 = num4;
			}
			tempDistances.Add(num4);
		}
		float num5 = 1f;
		if (num2 > num3)
		{
			num5 = 1f / (num2 - num3);
		}
		float target = ResolveTarget(rule, random);
		for (int l = 0; l < walkablePoints.BucketCount; l++)
		{
			float value = (tempDistances[l] - num3) * num5;
			int num6 = walkablePoints.BucketBegin(l);
			int num7 = walkablePoints.BucketEnd(l);
			for (int m = num6; m < num7; m++)
			{
				weights[m] += rule.weight * ApplyTarget(value, target);
			}
		}
	}

	private void CrossroadsRule(MapDescription.PlacementRule rule, System.Random random)
	{
		DistanceMap distanceMap = GetDistanceMap(partitionData.crossroads);
		float target = ResolveTarget(rule, random);
		for (int i = 0; i < walkablePoints.TileCount; i++)
		{
			weights[i] += rule.weight * ApplyTarget(distanceMap[i], target);
		}
	}

	private void MainObjectRule(MapDescription.PlacementRule rule, System.Random random)
	{
		DistanceMap distanceMap = GetDistanceMap(partitionData.mainObjectEncounters[rule.mainObjectIndex].entrance);
		float target = ResolveTarget(rule, random);
		for (int i = 0; i < walkablePoints.TileCount; i++)
		{
			weights[i] += rule.weight * ApplyTarget(distanceMap[i], target);
		}
	}

	private void ConnectionRule(MapDescription.PlacementRule rule, System.Random random)
	{
		if (TryGetConnectionPosition(out var position, rule.connectionIndex))
		{
			DistanceMap distanceMap = GetDistanceMap(position);
			float target = ResolveTarget(rule, random);
			for (int i = 0; i < walkablePoints.TileCount; i++)
			{
				weights[i] += rule.weight * ApplyTarget(distanceMap[i], target);
			}
		}
	}

	private void RoadRule(MapDescription.PlacementRule rule, System.Random random)
	{
		if (!zoneHasRoads)
		{
			return;
		}
		if (roadDistanceMap == null)
		{
			List<int> list = new List<int>();
			for (int i = 0; i < roadMap.Length; i++)
			{
				if (zoneMap[i] == zoneID && roadMap[i] > 0)
				{
					list.Add(i);
				}
			}
			if (list.Count <= 0)
			{
				zoneHasRoads = false;
				return;
			}
			roadDistanceMap = new DistanceMap(list, walkablePoints, pathfinder);
		}
		float target = ResolveTarget(rule, random);
		for (int j = 0; j < walkablePoints.TileCount; j++)
		{
			weights[j] += rule.weight * ApplyTarget(roadDistanceMap[j], target);
		}
	}

	private void MandatoryContentRule(MapDescription.PlacementRule rule, System.Random random)
	{
		int num = encounterEntranceByMandatoryContent[rule.mandatoryContentIndex];
		if (num >= 0)
		{
			DistanceMap distanceMap = GetDistanceMap(num);
			float target = ResolveTarget(rule, random);
			for (int i = 0; i < walkablePoints.TileCount; i++)
			{
				weights[i] += rule.weight * ApplyTarget(distanceMap[i], target);
			}
		}
	}

	private static bool TryParseSidRule(out string sid, string[] args, string zoneName)
	{
		sid = null;
		if (Utils.IsArrayNullOrEmpty(args))
		{
			Log.ConfigError(GetErrorText(zoneName, "sid not specified"));
			return false;
		}
		sid = args[0];
		return true;
	}

	private bool TryGetConnectionPosition(out int position, int connectionIndex)
	{
		Gate gate = gates[connectionIndex];
		if (gate.isValid)
		{
			if (gate.zoneFrom == zoneID)
			{
				position = gate.GetRoadPointFrom(mapSize);
			}
			else
			{
				position = gate.GetRoadPointTo(mapSize);
			}
		}
		else
		{
			position = portals[portalByConnection[connectionIndex]].entrance;
		}
		return true;
	}

	private static string GetErrorText(string zoneName, string error)
	{
		return "Failed to apply a rule to a mandatory object in zone '" + zoneName + "': " + error + ".";
	}
}
