using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class Layout
{
	public static class Consts
	{
		public const int MaxFootprintSize = 7;

		public const int MinSubzoneArea = 100;

		public const int PathPlayableRadius = 5;

		public const float ValuePerAreaMult = 0.1f;
	}

	public class DebugInfo
	{
		public PartitionData[] partitionDatas;

		public Vector2[] zonePositions;

		public float zoneSizeScale;

		public int[] subzoneMap;

		public int[] pathClusterMap;

		public GraphData[] pathGraphs;

		public DebugInfo(int zoneCount, Vector2[] zonePositions, float zoneSizeScale, PartitionData[] partitionDatas, WalkablePoints[] walkablePoints, GraphData[] pathGraphs, int[] subzoneMap)
		{
			this.zonePositions = zonePositions;
			this.zoneSizeScale = zoneSizeScale;
			this.subzoneMap = subzoneMap;
			this.pathGraphs = pathGraphs;
			this.partitionDatas = partitionDatas;
			if (walkablePoints.Length != 0)
			{
				pathClusterMap = walkablePoints[0].DebugInfo();
			}
		}
	}

	private MapDescription mapDesc;

	private Vector2Int size;

	private ZoneMap zoneMap;

	private sbyte[] elevationMap;

	private ObstacleState[] obstaclesMap;

	private int[] waterMap;

	private byte[] roadMap;

	private byte[] riverMap;

	private Gate[] gates;

	private Zone[] zones;

	private Connection[] connections;

	private int missingMandatoryContentSlots;

	private DebugInfo debugInfo;

	public const int CenterClearance = 2;

	public MapDescription MapDesc => mapDesc;

	public Vector2Int Size => size;

	public int TileCount => Size.x * Size.y;

	public int ZoneCount => zones.Length;

	public int ConnectionCount => connections.Length;

	public int GateCount => gates.Length;

	public int MissingMandatoryContentSlots => missingMandatoryContentSlots;

	public static Layout Generate(GeneratorConfig config, MapDescription mapDesc, bool createDebugInfo)
	{
		Vector2Int mapSize = new Vector2Int(mapDesc.sizeX, mapDesc.sizeZ);
		int count = mapDesc.zones.Count;
		EncounterTemplatesDatabase encounters = config.GetEncounters();
		ContentDatabase content = config.GetContent();
		Rng rng = new Rng(mapDesc.seed);
		ZoneMapper.MapZones(out var zoneMap, out var zonePositions, out var zoneSizeScale, rng.Create(), mapSize, mapDesc);
		MapShape.CreateNullZoneMapBorder(zoneMap, mapDesc, mapSize);
		Elevation.MapElevation(out var array, count, rng.Create(), mapDesc, mapSize, zoneMap);
		Borders.PlaceBorders(out var array2, out var subzoneMap, out var subzoneCount, mapSize, zoneMap, array.AsReadonly());
		Gates.PlaceGates(out var allGates, out var zoneGates, subzoneMap, zoneMap, array, array2, subzoneCount, rng.Create(), mapSize, mapDesc, zonePositions.AsReadonly());
		ZonePartition.ComputePartitions(out var partition, array2, count, subzoneCount, mapDesc, encounters, mapSize, rng.Create(), zoneGates.AsReadonly(), zoneMap, subzoneMap.AsReadonly(), zonePositions.AsReadonly());
		WalkablePaths.DrawWalkablePaths(out var walkablePoints, out var pathGraphs, array2, count, mapSize, rng.Create(), partition.AsReadonly(), allGates.AsReadonly(), zoneMap, subzoneMap.AsReadonly());
		Roads.AllocateRoadsData(out var array3, out var pathfinder, zoneGates.AsReadonly(), array2.AsReadonly(), mapDesc, mapSize);
		Roads.MapMainRoads(array3, pathfinder, mapDesc, mapSize, partition.AsReadonly(), zoneGates.AsReadonly());
		ContentTask.Create(out mapDesc.contentTask, mapDesc, rng.Create(), config, zoneMap, array2.AsReadonly());
		Encounters.PlaceEncounters(out var encounters2, out var heatMap, out var num, array2, array3, count, rng.Create(), mapDesc, content, pathfinder, encounters, mapSize, zoneMap, zoneGates.AsReadonly(), partition.AsReadonly(), walkablePoints.AsReadonly());
		Roads.MapEncounterRoads(array3, pathfinder, mapDesc, mapSize, encounters2.AsReadonly(), partition.AsReadonly(), zoneGates.AsReadonly());
		Obstacles.Fill(array2, zoneMap, mapDesc, heatMap, rng.Create(), mapSize);
		Lakes.CreateLakes(out var waterZoneMap, array, array2, zoneMap, mapDesc, rng.Create(), count, mapSize);
		Obstacles.FillUnreachable(array2, mapSize);
		Rivers.CreateRivers(out var array4, array2.AsReadonly(), array.AsReadonly(), array3.AsReadonly(), allGates.AsReadonly(), mapDesc, rng.Create(), mapSize);
		AmbientPickups.CreateAmbientPickupSlots(encounters2, array2, mapDesc, count, rng.Create(), mapSize, partition.AsReadonly(), zoneMap, array.AsReadonly(), array3.AsReadonly());
		CreateZonesAndConnections(out var array5, out var array6, mapDesc, zoneGates, encounters2, partition);
		Layout layout = new Layout();
		layout.mapDesc = mapDesc;
		layout.size = mapSize;
		layout.zoneMap = zoneMap;
		layout.elevationMap = array;
		layout.obstaclesMap = array2;
		layout.waterMap = waterZoneMap;
		layout.riverMap = array4;
		layout.roadMap = array3;
		layout.gates = allGates;
		layout.zones = array5;
		layout.connections = array6;
		layout.missingMandatoryContentSlots = num;
		if (createDebugInfo)
		{
			layout.debugInfo = new DebugInfo(count, zonePositions, zoneSizeScale, partition, walkablePoints, pathGraphs, subzoneMap);
		}
		return layout;
	}

	private static void CreateZonesAndConnections(out Zone[] zones, out Connection[] connections, MapDescription mapDesc, Gate[] gates, EncountersInZone[] encounters, PartitionData[] partitionDatas)
	{
		Utils.InitializeArray(new List<Vector2Int>[mapDesc.zones.Count]);
		connections = new Connection[mapDesc.connections.Count];
		for (int i = 0; i < mapDesc.connections.Count; i++)
		{
			MapDescription.Connection connection = mapDesc.connections[i];
			if (connection.connectionType == ConnectionType.Proximity)
			{
				connections[i] = new Connection(connection, connection.from, connection.to, ConnectionType.Proximity, -1);
				continue;
			}
			Gate gate = gates[i];
			ConnectionType connectionType = connection.connectionType;
			if (!gate.isValid && connection.connectionType == ConnectionType.Direct)
			{
				connectionType = ConnectionType.Portal;
			}
			if (connectionType == ConnectionType.Default)
			{
				connectionType = (gate.isValid ? ConnectionType.Direct : ConnectionType.Portal);
			}
			int guardPosition = (gate.isValid ? gate.guardPosition : (-1));
			connections[i] = new Connection(connection, connection.from, connection.to, connectionType, guardPosition);
		}
		zones = new Zone[mapDesc.zones.Count];
		for (int j = 0; j < mapDesc.zones.Count; j++)
		{
			zones[j] = new Zone(mapDesc.zones[j], encounters[j], partitionDatas[j]);
		}
	}

	private Layout()
	{
	}

	public Zone GetZone(int index)
	{
		return zones[index];
	}

	public Connection GetConnection(int index)
	{
		return connections[index];
	}

	public Gate GetGate(int index)
	{
		return gates[index];
	}

	public byte? GetPlayableZoneIdAt(int tile)
	{
		return zoneMap[tile];
	}

	public byte? GetVisualZoneIdAt(int tile)
	{
		return zoneMap.GetZone(tile);
	}

	public sbyte GetElevationAt(int tile)
	{
		return elevationMap[tile];
	}

	public ObstacleState GetObstacleStateAt(int tile)
	{
		return obstaclesMap[tile];
	}

	public int GetWaterAt(int tile)
	{
		return waterMap[tile];
	}

	public byte GetRiverAt(int tile)
	{
		return riverMap[tile];
	}

	public RoadType? GetRoadAt(int tile)
	{
		byte b = roadMap[tile];
		if (b == 0)
		{
			return null;
		}
		return (RoadType)(b - 1);
	}

	public ObstacleState[] GetObstacleStateCopy()
	{
		return Utils.CopyArray(obstaclesMap);
	}

	public DebugInfo GetDebugInfo()
	{
		return debugInfo;
	}
}
