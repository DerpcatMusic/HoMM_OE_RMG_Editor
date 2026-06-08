using System;
using System.Collections.Generic;
using System.Text;
using Hex.Configs;
using Hex.Map;
using UnityEngine;

namespace Hex.MapGenerator;

public class ContentPlacer
{
	private struct BuildingPlacementParams
	{
		public readonly bool isValid;

		public readonly Encounter encounter;

		public readonly int buildingIndex;

		public readonly Vector2Int positionInEncounter;

		public readonly bool flip;

		public BuildingPlacementParams(Encounter encounter, int buildingIndex, Vector2Int positionInEncounter, bool flip)
		{
			isValid = true;
			this.encounter = encounter;
			this.buildingIndex = buildingIndex;
			this.positionInEncounter = positionInEncounter;
			this.flip = flip;
		}
	}

	public class DebugInfo
	{
		public class ZoneContentSummary
		{
			public ContentCategorySummary guarded;

			public ContentCategorySummary unguarded;

			public List<(ContentSlot, Content)> contentList;

			public int totalValue;

			public ZoneContentSummary(int zoneIndex, ContentPlacer contentPlacer)
			{
				ContentRegistry contentRegistry = contentPlacer.contentRegistries[zoneIndex];
				List<int> list = new List<int>();
				contentRegistry.FilterSlots(list, EncounterType.Guarded, null, null, skipFillerResources: false);
				ContentPool guardedContentPool = contentPlacer.mapDesc.zones[zoneIndex].guardedContentPool;
				ContentPool unguardedContentPool = contentPlacer.mapDesc.zones[zoneIndex].unguardedContentPool;
				ContentPool resourcesContentPool = contentPlacer.mapDesc.zones[zoneIndex].resourcesContentPool;
				guarded = new ContentCategorySummary(contentPlacer, zoneIndex, list, guardedContentPool, resourcesContentPool);
				list.Clear();
				contentRegistry.FilterSlots(list, EncounterType.Unguarded, null, null, skipFillerResources: false);
				contentRegistry.GetAmbientPickupSlots(list, isFree: false);
				unguarded = new ContentCategorySummary(contentPlacer, zoneIndex, list, unguardedContentPool, resourcesContentPool);
				contentList = new List<(ContentSlot, Content)>();
				totalValue = 0;
				for (int i = 0; i < contentRegistry.SlotCount; i++)
				{
					ContentSlot slot = contentRegistry.GetSlot(i);
					if (!slot.IsFree())
					{
						Content content = contentRegistry.GetContent(slot.contentIndex);
						contentList.Add((slot, content));
						totalValue += content.value;
					}
				}
			}
		}

		public class ContentCategorySummary
		{
			public int valueMandatory;

			public int valueRandom;

			public int valueResources;

			public float[] targetPercentages;

			public float[] actualPercentages;

			public int[,] buildingsInBrackets;

			public int[] pickupsInBrackets;

			public Vector2Int[] brackets;

			public int mandatoryPickupsCount;

			public int mandatoryBuildingsCount;

			public int pickupSlotsCount;

			public int buildingSlotsCount;

			public int[] buildingSlotsCountBySize;

			public ContentCategorySummary(ContentPlacer contentPlacer, int zoneIndex, List<int> slots, ContentPool mainPool, ContentPool resourcePool)
			{
				ContentRegistry contentRegistry = contentPlacer.contentRegistries[zoneIndex];
				ContentPool.DebugInfo debugInfo = mainPool.GetDebugInfo();
				buildingSlotsCountBySize = new int[3];
				buildingsInBrackets = debugInfo.buildingsInValueBrackets;
				pickupsInBrackets = debugInfo.pickupsInValueBracket;
				valueMandatory = 0;
				valueRandom = 0;
				valueResources = 0;
				ValueDistribution valueDistribution = mainPool.ValueDistribution;
				int[] array = new int[valueDistribution.BracketCount];
				int num = 0;
				foreach (int slot2 in slots)
				{
					ContentSlot slot = contentRegistry.GetSlot(slot2);
					if (slot.type == ContentSlotType.Building)
					{
						buildingSlotsCount++;
						BuildingSlot buildingSlot = slot.encounter.template.buildings[slot.buildingIndex];
						int num2 = Mathf.Max(buildingSlot.width, buildingSlot.height);
						buildingSlotsCountBySize[num2 - 1]++;
					}
					else
					{
						pickupSlotsCount++;
					}
					if (slot.IsFree())
					{
						continue;
					}
					Content content = contentRegistry.GetContent(slot.contentIndex);
					if (content.pool == null && content.NeedsToPlaceMapObject)
					{
						if (slot.type == ContentSlotType.Building)
						{
							mandatoryBuildingsCount++;
						}
						else
						{
							mandatoryPickupsCount++;
						}
					}
					if (content.pool == null)
					{
						valueMandatory += content.value;
					}
					if (content.pool == mainPool)
					{
						valueRandom += content.value;
					}
					if (content.pool == resourcePool)
					{
						valueResources += content.value;
					}
					if (content.pool == mainPool)
					{
						int bracketForValue = mainPool.ValueDistribution.GetBracketForValue(content.value);
						array[bracketForValue] += content.value;
						num += content.value;
					}
				}
				targetPercentages = valueDistribution.TargetPercentages;
				brackets = valueDistribution.Brackets;
				actualPercentages = new float[valueDistribution.BracketCount];
				float num3 = ((num > 0) ? (1f / (float)num) : 0f);
				for (int i = 0; i < valueDistribution.BracketCount; i++)
				{
					actualPercentages[i] = (float)array[i] * num3;
				}
			}
		}

		public ContentPlacer contentPlacer;

		public Dictionary<int, int> variantByObjectId;

		public Content?[] contentByTile;

		public Encounter?[] encounterByTile;

		public Guard?[] guardByTile;

		public (int, int)?[] mainObjectByTile;

		public Dictionary<int, int> portalByTile;

		public ZoneContentSummary[] contentSummaries;

		public List<int>[] ambientPickupTiles;

		public EnvironmentPlacer.DebugInfo environment;

		public ObstacleState[] obstaclesMap;

		public DebugInfo(ContentPlacer contentPlacer, EnvironmentPlacer environmentPlacer)
		{
			this.contentPlacer = contentPlacer;
			variantByObjectId = contentPlacer.mapObjectRegistry.GetDebugInfo();
			CreateContentIndexByTile();
			CreateGuardByTile();
			CreateContentSummaries();
			CreateAmbientPickupTiles();
			CreatePortlaByTile();
			CreateEncounterByTile();
			environment = environmentPlacer.GetDebugInfo();
			obstaclesMap = contentPlacer.updatedObstaclesMap;
		}

		public void SerializeContentList(StringBuilder builder, int batch, bool newLine)
		{
			ContentRegistry[] contentRegistries = contentPlacer.contentRegistries;
			if (newLine)
			{
				builder.Append("\n");
			}
			for (int i = 0; i < contentRegistries.Length; i++)
			{
				ContentRegistry contentRegistry = contentRegistries[i];
				for (int j = 0; j < contentRegistry.SlotCount; j++)
				{
					ContentSlot slot = contentRegistry.GetSlot(j);
					if (!slot.IsFree())
					{
						Content content = contentRegistry.GetContent(slot.contentIndex);
						if (content.NeedsToPlaceMapObject)
						{
							bool value = content.pool == null;
							builder.Append(batch);
							builder.Append(", ");
							builder.Append(i);
							builder.Append(", ");
							builder.Append(content.objectDesc.Sid);
							builder.Append(", ");
							builder.Append(content.objectDesc.variant);
							builder.Append(", ");
							builder.Append(value);
							builder.Append("\n");
						}
					}
				}
			}
		}

		private void CreateAmbientPickupTiles()
		{
			ambientPickupTiles = new List<int>[contentPlacer.layout.ZoneCount];
			List<int> list = new List<int>();
			for (int i = 0; i < contentPlacer.layout.ZoneCount; i++)
			{
				ContentRegistry contentRegistry = contentPlacer.contentRegistries[i];
				List<int> list2 = new List<int>();
				ambientPickupTiles[i] = list2;
				list.Clear();
				contentRegistry.GetAmbientPickupSlots(list, isFree: false);
				foreach (int item in list)
				{
					list2.Add(contentRegistry.GetSlot(item).position);
				}
			}
		}

		private void CreateContentSummaries()
		{
			contentSummaries = new ZoneContentSummary[contentPlacer.layout.ZoneCount];
			for (int i = 0; i < contentPlacer.layout.ZoneCount; i++)
			{
				contentSummaries[i] = new ZoneContentSummary(i, contentPlacer);
			}
		}

		private void CreateContentIndexByTile()
		{
			contentByTile = new Content?[contentPlacer.layout.TileCount];
			mainObjectByTile = new(int, int)?[contentPlacer.layout.TileCount];
			ContentRegistry[] contentRegistries = contentPlacer.contentRegistries;
			for (int i = 0; i < contentRegistries.Length; i++)
			{
				ContentRegistry contentRegistry = contentRegistries[i];
				for (int j = 0; j < contentRegistry.SlotCount; j++)
				{
					ContentSlot slot = contentRegistry.GetSlot(j);
					if (!slot.IsFree())
					{
						Content content = contentRegistry.GetContent(slot.contentIndex);
						if (slot.type == ContentSlotType.Building)
						{
							MarkBuildingSlot(slot, content, null);
						}
						if (slot.type == ContentSlotType.Pickup)
						{
							MarkPickupSlot(slot, content);
						}
					}
				}
				Zone zone = contentPlacer.layout.GetZone(i);
				for (int k = 0; k < zone.config.mainObjects.Count; k++)
				{
					int num = zone.encounters.BeginByType(EncounterType.MainObject) + k;
					_ = zone.encounters[num];
					int index = contentRegistry.BeginByEncounter(num);
					ContentSlot slot2 = contentRegistry.GetSlot(index);
					if (!slot2.IsFree() && slot2.type == ContentSlotType.Building)
					{
						MarkBuildingSlot(slot2, null, (i, k));
					}
				}
			}
		}

		private void CreateEncounterByTile()
		{
			encounterByTile = new Encounter?[contentPlacer.layout.TileCount];
			ContentRegistry[] contentRegistries = contentPlacer.contentRegistries;
			for (int i = 0; i < contentRegistries.Length; i++)
			{
				Zone zone = contentPlacer.layout.GetZone(i);
				for (int j = 0; j < zone.encounters.Count; j++)
				{
					MarkEncounter(zone.encounters[j]);
				}
			}
		}

		private void MarkEncounter(Encounter encounter)
		{
			Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, contentPlacer.layout.Size);
			for (int i = 0; i < encounter.template.width; i++)
			{
				for (int j = 0; j < encounter.template.height; j++)
				{
					int num = GridUtils.CoordsToIndex(vector2Int + new Vector2Int(i, j), contentPlacer.layout.Size);
					encounterByTile[num] = encounter;
				}
			}
		}

		private void MarkBuildingSlot(ContentSlot slot, Content? content, (int, int)? mainObject)
		{
			Vector2Int vector2Int = GridUtils.IndexToCoords(slot.encounter.position, contentPlacer.layout.Size);
			BuildingSlot buildingSlot = slot.encounter.template.buildings[slot.buildingIndex];
			vector2Int += buildingSlot.position;
			for (int i = 0; i < buildingSlot.width; i++)
			{
				for (int j = 0; j < buildingSlot.height; j++)
				{
					int num = GridUtils.CoordsToIndex(vector2Int + new Vector2Int(i, j), contentPlacer.layout.Size);
					if (content.HasValue)
					{
						contentByTile[num] = content.Value;
					}
					if (mainObject.HasValue)
					{
						mainObjectByTile[num] = mainObject.Value;
					}
				}
			}
		}

		private void MarkPickupSlot(ContentSlot slot, Content content)
		{
			int pickupPosition = slot.GetPickupPosition(contentPlacer.layout.Size);
			contentByTile[pickupPosition] = content;
		}

		private void CreateGuardByTile()
		{
			guardByTile = new Guard?[contentPlacer.layout.TileCount];
			foreach (Guard guard in contentPlacer.guardList)
			{
				guardByTile[guard.position] = guard;
			}
		}

		private void CreatePortlaByTile()
		{
			portalByTile = new Dictionary<int, int>();
			foreach (var portal in contentPlacer.portalList)
			{
				Encounter item = portal.Item1;
				int item2 = portal.Item2;
				int key = GridUtils.CoordsToIndex(GridUtils.IndexToCoords(item.position, contentPlacer.layout.Size) + item.template.buildings[0].position, contentPlacer.layout.Size);
				portalByTile[key] = item2;
			}
		}
	}

	public const byte FallbackBiomeID = 1;

	private readonly GeneratorConfig config;

	private readonly MapDescription mapDesc;

	private readonly Layout layout;

	private readonly MapData mapData;

	private readonly MapObjectsRegistry mapObjectRegistry;

	private readonly ContentDatabase database;

	private readonly System.Random random;

	private readonly ContentRegistry[] contentRegistries;

	private readonly ContentSlotsFiller slotsFiller;

	private readonly List<Guard> guardList;

	private readonly List<(Encounter, int)> portalList;

	private readonly List<int> cityPath;

	private readonly Dictionary<string, SquadParams> mainGuardGroups;

	private int missingMandatoryHoboPickupSlots;

	private ObstacleState[] updatedObstaclesMap;

	private DebugInfo debugInfo;

	public int MissingMandatoryContent => layout.MissingMandatoryContentSlots + missingMandatoryHoboPickupSlots;

	public void Run(bool createDebugInfo)
	{
		SetGameRules();
		SetLandscape();
		SetAreas();
		PlaceMainObjects();
		PlacePortals();
		PlaceMines();
		PlaceMandatoryContent();
		EncounterHoles();
		PlaceGuardedContent();
		PlaceUnguardedContent();
		PlaceFillerResources();
		PlaceContentObjects();
		PlaceMainGuards();
		PlaceGladiatorArenas();
		PlaceEncounterGuards();
		EnvironmentPlacer environmentPlacer = new EnvironmentPlacer(config.GetEnvironmentAssets(), mapObjectRegistry, database, layout, mapDesc, updatedObstaclesMap, mapDesc.seed);
		environmentPlacer.PlaceAssets();
		mapObjectRegistry.WriteToMapData(mapData);
		if (createDebugInfo)
		{
			debugInfo = new DebugInfo(this, environmentPlacer);
		}
	}

	public DebugInfo GetDebugInfo()
	{
		return debugInfo;
	}

	public ContentPlacer(GeneratorConfig config, MapDescription mapDesc, Layout layout, MapData mapData)
	{
		this.config = config;
		this.mapDesc = mapDesc;
		this.layout = layout;
		this.mapData = mapData;
		mapObjectRegistry = new MapObjectsRegistry(layout.Size, layout.ZoneCount);
		database = config.GetContent();
		random = new Rng(mapDesc.seed).Create();
		updatedObstaclesMap = layout.GetObstacleStateCopy();
		contentRegistries = new ContentRegistry[layout.ZoneCount];
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			contentRegistries[i] = new ContentRegistry(i, mapDesc, layout, random);
		}
		slotsFiller = new ContentSlotsFiller(mapDesc.valueOverrides, random);
		guardList = new List<Guard>();
		portalList = new List<(Encounter, int)>();
		cityPath = new List<int>();
		mainGuardGroups = new Dictionary<string, SquadParams>();
	}

	private void SetGameRules()
	{
		List<MapWinCondition> list = new List<MapWinCondition>();
		WinConditions winConditions = mapDesc.gameRules.winConditions;
		if (winConditions.classic)
		{
			list.Add(new MapWinCondition
			{
				typeWinCondition = TypeWinCondition.Classic
			});
		}
		if (winConditions.desertion)
		{
			list.Add(new MapWinCondition
			{
				typeWinCondition = TypeWinCondition.Desertion,
				dayAdditionWinCondition = winConditions.desertionDay,
				valueDesertion = winConditions.desertionValue
			});
		}
		if (winConditions.heroLighting)
		{
			list.Add(new MapWinCondition
			{
				typeWinCondition = TypeWinCondition.HeroLighting,
				dayAdditionWinCondition = winConditions.heroLightingDay
			});
		}
		if (winConditions.lostStartCity)
		{
			list.Add(new MapWinCondition
			{
				typeWinCondition = TypeWinCondition.LostStartCity,
				countDayLostStartCity = winConditions.lostStartCityDay
			});
		}
		if (winConditions.lostStartHero)
		{
			list.Add(new MapWinCondition
			{
				typeWinCondition = TypeWinCondition.LostStartHero
			});
		}
		if (winConditions.gladiatorArena)
		{
			list.Add(new MapWinCondition
			{
				typeWinCondition = TypeWinCondition.GladiatorArena,
				isRegistrationStartWork = winConditions.gladiatorArenaRegistrationStartWork,
				isRegistrationStartFight = winConditions.gladiatorArenaRegistrationStartFight,
				daysDelayStart = winConditions.gladiatorArenaDaysDelayStart,
				countDayGladiatorArena = winConditions.gladiatorArenaCountDay
			});
		}
		if (!EnumParser.TryParceEnum<EMapGameMode>(mapDesc.template.gameMode, out var value))
		{
			Log.ConfigError("Couldn't parse gameMode type '" + mapDesc.template.gameMode + "' in template '" + mapDesc.name + "'.");
		}
		mapData.settings.gameMode = value;
		mapData.settings.mapWinConditions = list.ToArray();
		mapData.settings.enableHeroHireBan = mapDesc.gameRules.heroHireBan;
		mapData.settings.heroCountMin = mapDesc.gameRules.heroCountMin;
		mapData.settings.heroCountMax = mapDesc.gameRules.heroCountMax;
		mapData.settings.heroCountIncrement = mapDesc.gameRules.heroCountIncrement;
		mapData.settings.isTournamentRules = mapDesc.gameRules.tournamentRules;
		mapData.settings.uniqueMagicCostModifiers = mapDesc.gameRules.uniqueMagicCostModifiers;
		mapData.settings.bonuses = mapDesc.gameRules.bonuses;
		mapData.settings.enableCustomAI = mapDesc.gameRules.customAI != null;
		mapData.settings.customAISid = mapDesc.gameRules.customAI ?? "";
		mapData.objectValuesOverrides = new ObjectValuesOverrides();
		foreach (ContentValueOverride item in mapDesc.valueOverrides.All)
		{
			mapData.objectValuesOverrides.Add(new ObjectValuesOverride
			{
				sid = item.sid,
				variantIndex = item.variant,
				goodsValue = item.goodsValue,
				aiValue = item.aiValue
			});
		}
	}

	private void SetAreas()
	{
		mapData.areasVersion = 1uL;
		mapData.areas = new MapDataArea[layout.ZoneCount];
		for (byte b = 0; b < layout.ZoneCount; b++)
		{
			List<int> list = new List<int>();
			for (int i = 0; i < layout.TileCount; i++)
			{
				if (layout.GetVisualZoneIdAt(i) == b)
				{
					list.Add(i);
				}
			}
			List<int> list2 = new List<int>();
			bool[] array = new bool[layout.ZoneCount];
			for (int j = 0; j < layout.ConnectionCount; j++)
			{
				Connection connection = layout.GetConnection(j);
				if (connection.type != ConnectionType.Proximity)
				{
					if (connection.zoneFrom == b)
					{
						array[connection.zoneTo] = true;
					}
					if (connection.zoneTo == b)
					{
						array[connection.zoneFrom] = true;
					}
				}
			}
			for (int k = 0; k < layout.ZoneCount; k++)
			{
				if (array[k])
				{
					list2.Add(k);
				}
			}
			MapDataArea mapDataArea = new MapDataArea();
			mapDataArea.id = b;
			mapDataArea.rootNode = layout.GetZone(b).crossroads;
			mapDataArea.nodes = list;
			mapDataArea.neighbors = list2;
			mapDataArea.biome = ContentDatabase.GetBiomeSidForId(mapDesc.zones[b].zoneBiome);
			mapData.areas[b] = mapDataArea;
		}
	}

	private void SetLandscape()
	{
		for (int i = 0; i < layout.TileCount; i++)
		{
			byte? visualZoneIdAt = layout.GetVisualZoneIdAt(i);
			byte v = 1;
			if (visualZoneIdAt.HasValue)
			{
				v = mapDesc.zones[visualZoneIdAt.Value].zoneBiome;
			}
			sbyte elevationAt = layout.GetElevationAt(i);
			int waterAt = layout.GetWaterAt(i);
			mapData.SetTilesMap(i, v);
			mapData.SetLevelsMap(i, elevationAt);
			if (waterAt >= 0)
			{
				byte v2 = ((waterAt == 255) ? database.GetWaterConfigByName(mapDesc.border.waterType).id : database.GetWaterIdForBiomeId(mapDesc.zones[waterAt].zoneBiome));
				mapData.SetWaterMap(i, v2);
			}
		}
		for (int j = 0; j < layout.GateCount; j++)
		{
			Gate gate = layout.GetGate(j);
			if (gate.isValid && gate.isRamp)
			{
				Vector2Int vector2Int = Direction.FromIndex(gate.rampDirection);
				for (int k = 0; k < gate.rampWidth; k++)
				{
					int neighbour = GridUtils.GetNeighbour(vector2Int * k, gate.rampPosition, layout.Size);
					mapData.SetClimbsMap(neighbour, 1);
				}
			}
		}
		for (int l = 0; l < layout.TileCount; l++)
		{
			RoadType? roadAt = layout.GetRoadAt(l);
			if (roadAt.HasValue)
			{
				mapData.SetRoad(l, GeneratorConfig.RoadIdByType(roadAt.Value));
			}
		}
		mapData.rivers = new RiverData[1];
		mapData.rivers[0] = new RiverData();
		RiverData riverData = mapData.rivers[0];
		riverData.sid = "test";
		riverData.randomSeed = 0;
		riverData.nodes = new List<RiverNodeData>();
		ObjectConfig objectConfig = MapConfig.me.objects.Get("bridge_wood");
		ObjectConfig objectConfig2 = MapConfig.me.objects.Get("bridge_stone");
		for (int m = 0; m < layout.TileCount; m++)
		{
			if (layout.GetRiverAt(m) != 0)
			{
				RiverNodeData riverNodeData = new RiverNodeData();
				riverNodeData.n = m;
				riverData.nodes.Add(riverNodeData);
				RoadType? roadAt2 = layout.GetRoadAt(m);
				if (roadAt2.HasValue)
				{
					bool flag = GetBridgeDirection(m);
					ObjectConfig obj = ((roadAt2 == RoadType.Dirt) ? objectConfig : objectConfig2);
					mapObjectRegistry.AddObject(obj, new MapObjectPosition(m, flag ? 1 : 0));
				}
			}
		}
		bool CheckRiverNeighbour(int tile, Vector2Int offset)
		{
			int neighbour2 = GridUtils.GetNeighbour(offset, tile, layout.Size);
			if (neighbour2 < 0)
			{
				return false;
			}
			return layout.GetRiverAt(neighbour2) != 0;
		}
		bool GetBridgeDirection(int tile)
		{
			if (CheckRiverNeighbour(tile, Vector2Int.up))
			{
				return false;
			}
			if (CheckRiverNeighbour(tile, Vector2Int.down))
			{
				return false;
			}
			return true;
		}
	}

	private void PlacePortals()
	{
		int num = 0;
		for (int i = 0; i < layout.ConnectionCount; i++)
		{
			Connection connection = layout.GetConnection(i);
			if (connection.type == ConnectionType.Portal)
			{
				ObjectConfig portal = database.GetPortal(num);
				num++;
				Zone zone = layout.GetZone(connection.zoneFrom);
				Zone zone2 = layout.GetZone(connection.zoneTo);
				int encounterIndexForConnection = zone.encounters.GetEncounterIndexForConnection(i);
				int encounterIndexForConnection2 = zone2.encounters.GetEncounterIndexForConnection(i);
				Encounter encounter = zone.encounters[encounterIndexForConnection];
				Encounter encounter2 = zone2.encounters[encounterIndexForConnection2];
				BuildingPlacementParams placement;
				bool num2 = TryFitBuildingIntoEncounter(out placement, encounter, 1, 1, InteractionLayout.CornerRight);
				BuildingPlacementParams placement2;
				bool flag = TryFitBuildingIntoEncounter(out placement2, encounter2, 1, 1, InteractionLayout.CornerRight);
				GeneratorException.ThrowIfFalse(num2 && flag, "Failed to place a portal into a designated encounter.", Log.Context.ConnIndex(i));
				ContentRegistry obj = contentRegistries[connection.zoneFrom];
				ContentRegistry contentRegistry = contentRegistries[connection.zoneTo];
				int slotIndex = obj.BeginByEncounter(encounterIndexForConnection) + placement.buildingIndex;
				int slotIndex2 = contentRegistry.BeginByEncounter(encounterIndexForConnection2) + placement2.buildingIndex;
				obj.AddContentToSlot(slotIndex, Content.ValueOnly(0, 0));
				contentRegistry.AddContentToSlot(slotIndex2, Content.ValueOnly(0, 0));
				MapDescription.Connection connection2 = mapDesc.connections[i];
				int fromID = PlaceBuilding(placement, portal, -1, 0);
				int toID = PlaceBuilding(placement2, portal, -1, 0);
				SquadParams squadParamsForConnection = GetSquadParamsForConnection(connection);
				mapObjectRegistry.MakePortalPair(fromID, toID, connection2.portalFromEnabled, connection2.portalToEnabled, squadParamsForConnection);
				portalList.Add((encounter, connection.zoneTo));
				portalList.Add((encounter2, connection.zoneFrom));
			}
		}
	}

	private void PlaceMines()
	{
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			Zone zone = layout.GetZone(i);
			List<MapDescription.MandatoryContent> mandatoryContent = mapDesc.zones[i].mandatoryContent;
			List<MapObjectDesc> list = mapDesc.contentTask.mandatory[i];
			if (mandatoryContent.Count == 0)
			{
				continue;
			}
			EncountersInZone encounters = zone.encounters;
			ContentRegistry contentRegistry = contentRegistries[i];
			for (int j = 0; j < mandatoryContent.Count; j++)
			{
				MapDescription.MandatoryContent mandatoryContent2 = mandatoryContent[j];
				MapObjectDesc mapObjectDesc = list[j];
				if (mapObjectDesc.IsNull || !mandatoryContent2.isMine)
				{
					continue;
				}
				int encounterIndexForMandatoryContent = encounters.GetEncounterIndexForMandatoryContent(j);
				if (encounterIndexForMandatoryContent == -1)
				{
					continue;
				}
				MapObjectDesc mapObjectDesc2 = mapObjectDesc;
				ESpawn? owner = mandatoryContent2.owner;
				Encounter encounter = encounters[encounterIndexForMandatoryContent];
				int buildingSizeX = mapObjectDesc2.mapConfig.generatorConfig.buildingSizeX;
				int buildingSizeZ = mapObjectDesc2.mapConfig.generatorConfig.buildingSizeZ;
				InteractionLayout buildingInteractionLayout = mapObjectDesc2.mapConfig.generatorConfig.buildingInteractionLayout;
				int num = CanFitBuildingIntoEncounter(encounter, buildingSizeX, buildingSizeZ, buildingInteractionLayout);
				if (num >= 0)
				{
					int value = mapDesc.valueOverrides.GetValue(mapObjectDesc2);
					int guardValue = mapDesc.valueOverrides.GetGuardValue(mapObjectDesc2);
					int slotIndex = contentRegistry.BeginByEncounter(encounterIndexForMandatoryContent) + num;
					contentRegistry.AddContentToSlot(slotIndex, Content.Object(mapObjectDesc2, owner, value, guardValue, canBeMoved: false));
					if (database.TryGetResourceForMine(mapObjectDesc.Sid, out var desc))
					{
						int num2 = contentRegistry.BeginByEncounter(encounterIndexForMandatoryContent, ContentSlotType.Pickup);
						int num3 = contentRegistry.EndByEncounter(encounterIndexForMandatoryContent, ContentSlotType.Pickup);
						int value2 = mapDesc.valueOverrides.GetValue(desc);
						int guardValue2 = mapDesc.valueOverrides.GetGuardValue(desc);
						for (int k = num2; k < num3; k++)
						{
							contentRegistry.AddContentToSlot(k, Content.Object(desc, null, value2, guardValue2, canBeMoved: false));
						}
					}
					continue;
				}
				throw new GeneratorException("Failed to place a mine into a designated encounter.", Log.Context.Zone(mapDesc.zones[i]));
			}
		}
	}

	private void EncounterHoles()
	{
		if (!mapDesc.gameRules.encounterHoles)
		{
			return;
		}
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			Zone zone = layout.GetZone(i);
			EncountersInZone encounters = zone.encounters;
			ContentRegistry contentRegistry = contentRegistries[i];
			List<int> list = new List<int>(encounters.Count);
			for (int j = encounters.BeginByType(EncounterType.Guarded); j < encounters.EndByType(EncounterType.Guarded); j++)
			{
				list.Add(j);
			}
			RngUtils.Shuffle(list, random);
			EncounterHolesSettings encounterHolesSettings = zone.config.encounterHolesSettings;
			int num = Mathf.FloorToInt(encounterHolesSettings.affectedEncounters * (float)list.Count);
			int num2 = Mathf.FloorToInt(encounterHolesSettings.affectedEncounters * encounterHolesSettings.twoHoleEncounters * (float)list.Count);
			int num3 = 0;
			int num4 = 0;
			List<(bool, int)> list2 = new List<(bool, int)>();
			for (int k = 0; k < list.Count; k++)
			{
				if (num3 >= num)
				{
					break;
				}
				list2.Clear();
				int encounterIndex = list[k];
				GetPotentialEncounterHoles(list2, i, encounterIndex);
				if (list2.Count != 0)
				{
					RngUtils.Shuffle(list2, random);
					num3++;
					AddEncounterHole(list2[0].Item1, list2[0].Item2, contentRegistry);
					if (list2.Count >= 2 && num4 < num2)
					{
						AddEncounterHole(list2[1].Item1, list2[1].Item2, contentRegistry);
						num4++;
					}
				}
			}
		}
	}

	private void AddEncounterHole(bool isPickup, int index, ContentRegistry contentRegistry)
	{
		if (isPickup)
		{
			contentRegistry.AddContentToSlot(index, Content.ValueOnly(0, 0));
		}
		else
		{
			updatedObstaclesMap[index] = ObstacleState.Reserved;
		}
	}

	private void GetPotentialEncounterHoles(List<(bool, int)> result, int zoneIndex, int encounterIndex)
	{
		Encounter encounter = layout.GetZone(zoneIndex).encounters[encounterIndex];
		ContentRegistry contentRegistry = contentRegistries[zoneIndex];
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, layout.Size);
		foreach (Vector2Int holeTile in encounter.template.holeTiles)
		{
			int num = GridUtils.CoordsToIndex(vector2Int + holeTile, layout.Size);
			if (updatedObstaclesMap[num] == ObstacleState.AlwaysObstacle)
			{
				result.Add((false, num));
			}
		}
		int num2 = contentRegistry.BeginByEncounter(encounterIndex, ContentSlotType.Pickup);
		int num3 = contentRegistry.EndByEncounter(encounterIndex, ContentSlotType.Pickup);
		for (int i = num2; i < num3; i++)
		{
			ContentSlot slot = contentRegistry.GetSlot(i);
			if (slot.IsFree() && encounter.template.pickups[slot.pickupIndex].canBeHole)
			{
				result.Add((true, i));
			}
		}
	}

	private void PlaceMandatoryContent()
	{
		List<int> pickupSlots = new List<int>();
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			Zone zone = layout.GetZone(i);
			List<MapDescription.MandatoryContent> mandatoryContent = mapDesc.zones[i].mandatoryContent;
			List<MapObjectDesc> list = mapDesc.contentTask.mandatory[i];
			if (mandatoryContent.Count == 0)
			{
				continue;
			}
			EncountersInZone encounters = zone.encounters;
			ContentRegistry contentRegistry = contentRegistries[i];
			for (int j = 0; j < mandatoryContent.Count; j++)
			{
				MapDescription.MandatoryContent mandatoryContent2 = mandatoryContent[j];
				MapObjectDesc mapObjectDesc = list[j];
				if (mapObjectDesc.IsNull || mandatoryContent2.isMine)
				{
					continue;
				}
				int encounterIndexForMandatoryContent = encounters.GetEncounterIndexForMandatoryContent(j);
				if (encounterIndexForMandatoryContent == -1)
				{
					continue;
				}
				bool canBeMoved = mandatoryContent2.rules.Count == 0;
				ESpawn? owner = mandatoryContent2.owner;
				if (ContentDatabase.IsMapObjectBuilding(mapObjectDesc))
				{
					Encounter encounter = encounters[encounterIndexForMandatoryContent];
					int buildingSizeX = mapObjectDesc.mapConfig.generatorConfig.buildingSizeX;
					int buildingSizeZ = mapObjectDesc.mapConfig.generatorConfig.buildingSizeZ;
					InteractionLayout buildingInteractionLayout = mapObjectDesc.mapConfig.generatorConfig.buildingInteractionLayout;
					int num = CanFitBuildingIntoEncounter(encounter, buildingSizeX, buildingSizeZ, buildingInteractionLayout);
					if (num >= 0)
					{
						int value = mapDesc.valueOverrides.GetValue(mapObjectDesc);
						int guardValue = mapDesc.valueOverrides.GetGuardValue(mapObjectDesc);
						int slotIndex = contentRegistry.BeginByEncounter(encounterIndexForMandatoryContent, ContentSlotType.Building) + num;
						contentRegistry.AddContentToSlot(slotIndex, Content.Object(mapObjectDesc, owner, value, guardValue, canBeMoved));
						continue;
					}
					throw new GeneratorException("Failed to place a mandatory building into a designated encounter.", Log.Context.Zone(mapDesc.zones[i]));
				}
				int num2 = contentRegistry.BeginByEncounter(encounterIndexForMandatoryContent, ContentSlotType.Pickup);
				int num3 = contentRegistry.EndByEncounter(encounterIndexForMandatoryContent, ContentSlotType.Pickup);
				int num4 = -1;
				for (int k = num2; k < num3; k++)
				{
					ContentSlot slot = contentRegistry.GetSlot(k);
					if (slot.IsFree() && !slot.fillerResource)
					{
						num4 = k;
						break;
					}
				}
				if (num4 >= 0)
				{
					int value2 = mapDesc.valueOverrides.GetValue(mapObjectDesc);
					int guardValue2 = mapDesc.valueOverrides.GetGuardValue(mapObjectDesc);
					contentRegistry.AddContentToSlot(num4, Content.Object(mapObjectDesc, owner, value2, guardValue2, canBeMoved));
					continue;
				}
				throw new GeneratorException("Failed to place a mandatory pickup into a designated encounter.", Log.Context.Zone(mapDesc.zones[i]));
			}
			PlaceHoboMandatoryPickups(i, isGuarded: true, pickupSlots, mandatoryContent, contentRegistry, encounters);
			PlaceHoboMandatoryPickups(i, isGuarded: false, pickupSlots, mandatoryContent, contentRegistry, encounters);
		}
	}

	private void PlaceHoboMandatoryPickups(int zoneIndex, bool isGuarded, List<int> pickupSlots, List<MapDescription.MandatoryContent> mandatoryContent, ContentRegistry contentRegistry, EncountersInZone encounters)
	{
		pickupSlots.Clear();
		if (isGuarded)
		{
			contentRegistry.FilterSlots(pickupSlots, EncounterType.Guarded, ContentSlotType.Pickup, true);
		}
		else
		{
			contentRegistry.GetAmbientPickupSlots(pickupSlots, isFree: true);
		}
		RngUtils.Shuffle(pickupSlots, random);
		int num = 0;
		for (int i = 0; i < mandatoryContent.Count; i++)
		{
			MapDescription.MandatoryContent mandatoryContent2 = mandatoryContent[i];
			MapObjectDesc mapObjectDesc = mapDesc.contentTask.mandatory[zoneIndex][i];
			if (mapObjectDesc.IsNull)
			{
				continue;
			}
			ESpawn? owner = mandatoryContent2.owner;
			bool num2 = ContentDatabase.IsMapObjectBuilding(mapObjectDesc);
			int encounterIndexForMandatoryContent = encounters.GetEncounterIndexForMandatoryContent(i);
			if (!num2 && encounterIndexForMandatoryContent < 0 && isGuarded == mandatoryContent2.isGuarded)
			{
				if (num >= pickupSlots.Count)
				{
					string text = (isGuarded ? "guarded" : "unguarded");
					Log.ConfigError(Log.FormatContext("Not enough slots for " + text + " mandatory pickups.", Log.Context.ZoneIndex(zoneIndex), mapDesc));
					missingMandatoryHoboPickupSlots++;
					break;
				}
				int slotIndex = pickupSlots[num];
				num++;
				int value = mapDesc.valueOverrides.GetValue(mapObjectDesc);
				int guardValue = mapDesc.valueOverrides.GetGuardValue(mapObjectDesc);
				contentRegistry.AddContentToSlot(slotIndex, Content.Object(mapObjectDesc, owner, value, guardValue, canBeMoved: true));
			}
		}
	}

	private void PlaceMainObjects()
	{
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			Zone zone = layout.GetZone(i);
			ContentRegistry contentRegistry = contentRegistries[i];
			int num = -1;
			int num2 = -1;
			for (int j = 0; j < zone.config.mainObjects.Count; j++)
			{
				MapDescription.MainObject mainObject = zone.config.mainObjects[j];
				if (mainObject.isKeyObject)
				{
					num = j;
					break;
				}
				if ((mainObject.type == MainObjectType.Spawn || mainObject.type == MainObjectType.City || mainObject.type == MainObjectType.AbandonedOutpost) && num2 == -1)
				{
					num2 = j;
				}
			}
			if (num == -1)
			{
				num = num2;
			}
			for (int k = 0; k < zone.config.mainObjects.Count; k++)
			{
				MapDescription.MainObject mainObject2 = zone.config.mainObjects[k];
				int num3 = zone.encounters.BeginByType(EncounterType.MainObject) + k;
				Encounter encounter = zone.encounters[num3];
				int slotIndex = contentRegistry.BeginByEncounter(num3);
				contentRegistry.AddContentToSlot(slotIndex, Content.ValueOnly(0, 0));
				string faction = mapDesc.zones[i].mainObjects[k].faction;
				PlaceMainObject(encounter, faction, mainObject2, k == num, i);
			}
		}
	}

	private void PlaceGuardedContent()
	{
		List<int> list = new List<int>();
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			ContentRegistry contentRegistry = contentRegistries[i];
			byte contentBiome = mapDesc.zones[i].contentBiome;
			int area = layout.GetZone(i).area;
			list.Clear();
			contentRegistry.FilterSlots(list, EncounterType.Guarded, null, true);
			RngUtils.Shuffle(list, random);
			ContentPool guardedContentPool = mapDesc.zones[i].guardedContentPool;
			List<MapObjectDesc> objectsWithSlots = mapDesc.contentTask.guarded[i].GetObjectsWithSlots(isGuarded: true);
			slotsFiller.Fill(list, contentBiome, area, objectsWithSlots, guardedContentPool, contentRegistry);
		}
	}

	private void PlaceUnguardedContent()
	{
		List<int> list = new List<int>();
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			ContentRegistry contentRegistry = contentRegistries[i];
			byte contentBiome = mapDesc.zones[i].contentBiome;
			int area = layout.GetZone(i).area;
			list.Clear();
			contentRegistry.FilterSlots(list, EncounterType.Unguarded, null, true);
			contentRegistry.GetAmbientPickupSlots(list, isFree: true);
			RngUtils.Shuffle(list, random);
			ContentPool unguardedContentPool = mapDesc.zones[i].unguardedContentPool;
			List<MapObjectDesc> objectsWithSlots = mapDesc.contentTask.unguarded[i].GetObjectsWithSlots(isGuarded: false);
			slotsFiller.Fill(list, contentBiome, area, objectsWithSlots, unguardedContentPool, contentRegistry);
			list.Clear();
			contentRegistry.FilterSlots(list, EncounterType.Unguarded, null, true);
			contentRegistry.GetAmbientPickupSlots(list, isFree: true);
			RngUtils.Shuffle(list, random);
			ContentPool resourcesContentPool = mapDesc.zones[i].resourcesContentPool;
			List<MapObjectDesc> content = mapDesc.contentTask.resources[i];
			slotsFiller.Fill(list, contentBiome, area, content, resourcesContentPool, contentRegistry);
		}
	}

	private void PlaceFillerResources()
	{
		List<int> list = new List<int>();
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			ContentPool resourcesContentPool = mapDesc.zones[i].resourcesContentPool;
			ContentRegistry contentRegistry = contentRegistries[i];
			byte contentBiome = mapDesc.zones[i].contentBiome;
			list.Clear();
			contentRegistry.FilterSlots(list, EncounterType.Guarded, ContentSlotType.Pickup, true, skipFillerResources: false);
			foreach (int item in list)
			{
				MapObjectDesc? pickup = resourcesContentPool.GetPickup(contentBiome, random, -1, -1, contentRegistry.Limits);
				if (pickup.HasValue)
				{
					MapObjectDesc value = pickup.Value;
					int value2 = mapDesc.valueOverrides.GetValue(value);
					int guardValue = mapDesc.valueOverrides.GetGuardValue(value);
					Content content = Content.ObjectFromPool(value, value2, guardValue, canBeMoved: true, resourcesContentPool);
					contentRegistry.AddContentToSlot(item, content);
				}
			}
		}
	}

	private void PlaceContentObjects()
	{
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			ContentRegistry contentRegistry = contentRegistries[i];
			byte metaObjectsBiome = mapDesc.zones[i].metaObjectsBiome;
			for (int j = 0; j < contentRegistry.SlotCount; j++)
			{
				ContentSlot slot = contentRegistry.GetSlot(j);
				if (slot.contentIndex == -1)
				{
					continue;
				}
				Content content = contentRegistry.GetContent(slot.contentIndex);
				if (!content.NeedsToPlaceMapObject)
				{
					continue;
				}
				MapObjectDesc objectDesc = content.objectDesc;
				int buildingSizeX = objectDesc.mapConfig.generatorConfig.buildingSizeX;
				int buildingSizeZ = objectDesc.mapConfig.generatorConfig.buildingSizeZ;
				InteractionLayout buildingInteractionLayout = objectDesc.mapConfig.generatorConfig.buildingInteractionLayout;
				if (slot.type == ContentSlotType.Building)
				{
					if (EncounterUtils.TryFitBuilding(out var position, out var flip, slot.encounter.template, slot.buildingIndex, buildingSizeX, buildingSizeZ, buildingInteractionLayout))
					{
						BuildingPlacementParams placement = new BuildingPlacementParams(slot.encounter, slot.buildingIndex, position, flip);
						int id = PlaceBuilding(placement, objectDesc.mapConfig, objectDesc.variant, metaObjectsBiome);
						if (objectDesc.metaObjectDesc != null)
						{
							objectDesc.metaObjectDesc.AddProps(id, mapObjectRegistry, mapDesc, i);
						}
						if (content.owner.HasValue)
						{
							mapObjectRegistry.AddOwner(id, content.owner.Value);
						}
					}
				}
				else
				{
					int id2 = PlacePickup(objectDesc.mapConfig, objectDesc.variant, metaObjectsBiome, slot);
					if (objectDesc.metaObjectDesc != null)
					{
						objectDesc.metaObjectDesc.AddProps(id2, mapObjectRegistry, mapDesc, i);
					}
					if (content.owner.HasValue)
					{
						mapObjectRegistry.AddOwner(id2, content.owner.Value);
					}
				}
			}
		}
	}

	private void PlaceEncounterGuards()
	{
		for (int i = 0; i < layout.ZoneCount; i++)
		{
			PlaceEncounterGuards(i, EncounterType.Guarded);
		}
	}

	private void PlaceEncounterGuards(int zoneIndex, EncounterType encounterType)
	{
		Zone zone = layout.GetZone(zoneIndex);
		EncountersInZone encounters = zone.encounters;
		float[] reactWeights = MapDescription.DefaultGuardReactionDistribution;
		if (6 != zone.config.guardReactionDistribution.Length)
		{
			Log.ConfigError($"Zone {zone.config.name}: Number of values for guardReactionDistribution must be {6}");
		}
		else
		{
			reactWeights = zone.config.guardReactionDistribution;
		}
		for (int i = encounters.BeginByType(encounterType); i < encounters.EndByType(encounterType); i++)
		{
			Encounter encounter = encounters[i];
			int num = contentRegistries[zoneIndex].EncounterGuardStrength(i);
			Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, layout.Size);
			GuardSlot[] guards = encounter.template.guards;
			for (int j = 0; j < guards.Length; j++)
			{
				int position = GridUtils.CoordsToIndex(guards[j].position + vector2Int, layout.Size);
				if (num >= zone.config.guardCutoffValue)
				{
					SquadParams squadParamsForEncounter = GetSquadParamsForEncounter(num, reactWeights, zone.config);
					PlaceSquad(position, squadParamsForEncounter);
				}
			}
		}
	}

	private void PlaceGladiatorArenas()
	{
		for (int i = 0; i < layout.ConnectionCount; i++)
		{
			Connection connection = layout.GetConnection(i);
			if (connection.type == ConnectionType.GladiatorArena)
			{
				mapObjectRegistry.AddGladiatorArena(connection.guardPosition);
			}
		}
	}

	private void PlaceMainGuards()
	{
		for (int i = 0; i < layout.ConnectionCount; i++)
		{
			Connection connection = layout.GetConnection(i);
			if (connection.type == ConnectionType.Direct)
			{
				SquadParams squadParamsForConnection = GetSquadParamsForConnection(connection);
				PlaceSquad(connection.guardPosition, squadParamsForConnection);
			}
		}
	}

	private SquadParams GetSquadParamsForConnection(Connection connection)
	{
		SquadParams value = default(SquadParams);
		string guardMatchGroup = connection.config.guardMatchGroup;
		if (!string.IsNullOrEmpty(guardMatchGroup))
		{
			if (mainGuardGroups.TryGetValue(guardMatchGroup, out value))
			{
				if (value.value != connection.config.guardValue)
				{
					Log.ConfigError(mapDesc.name + ", GuardMatchGroup '" + guardMatchGroup + "' contains guards with different values.");
				}
				if (value.weeklyIncrement != connection.config.guardWeeklyIncrement)
				{
					Log.ConfigError(mapDesc.name + ", GuardMatchGroup '" + guardMatchGroup + "' contains guards with different guardWeeklyIncrements.");
				}
				if (value.disposition != connection.config.guardReaction)
				{
					Log.ConfigError(mapDesc.name + ", GuardMatchGroup '" + guardMatchGroup + "' contains guards with different reactions.");
				}
				if (value.escape != connection.config.guardEscape)
				{
					Log.ConfigError(mapDesc.name + ", GuardMatchGroup '" + guardMatchGroup + "' contains guards with different guardEscapes.");
				}
			}
			else
			{
				List<SquadConfig> matchingGuards = ContentDatabase.GetMatchingGuards(connection.config.guardValue, isMainGuard: true);
				List<float> list = new List<float>();
				List<int> list2 = new List<int>();
				for (int i = 0; i < matchingGuards.Count; i++)
				{
					float num = matchingGuards[i].rollChance;
					if (num > 0f)
					{
						list2.Add(i);
						list.Add(num);
					}
				}
				SquadConfig squadConfig = matchingGuards[list2[RngUtils.WeightedIndex(list, random)]];
				value = SquadParams.ConnectionGuard(connection.config.guardValue, connection.config.guardWeeklyIncrement, connection.config.guardReaction, connection.config.guardEscape, squadConfig);
				mainGuardGroups[guardMatchGroup] = value;
			}
		}
		else
		{
			value = SquadParams.ConnectionGuard(connection.config.guardValue, connection.config.guardWeeklyIncrement, connection.config.guardReaction, connection.config.guardEscape, null);
		}
		return value;
	}

	private SquadParams GetSquadParamsForEncounter(int value, float[] reactWeights, MapDescription.Zone zone)
	{
		value = GetModifiedGuardValue(value, zone.guardRandomization, zone.guardMultiplier);
		ESquadReactionType disposition = (ESquadReactionType)RngUtils.WeightedIndex(reactWeights, random);
		return SquadParams.EncounterGuard(value, zone.guardWeeklyIncrement, zone.diplomacyModifier, disposition);
	}

	private SquadParams? GetSquadParamsForMainObject(MapDescription.MainObject mainObject)
	{
		if ((float)random.Next(100) >= Mathf.Clamp01(mainObject.guardChance) * 100f)
		{
			return null;
		}
		return SquadParams.MainObjectGuard(GetModifiedGuardValue(mainObject.guardValue, mainObject.guardRandomization, 1f), mainObject.guardWeeklyIncrement);
	}

	private int GetModifiedGuardValue(int value, float rnd, float mult)
	{
		float num = 1f + (float)random.Next(-100, 100) * 0.01f * rnd;
		return Mathf.CeilToInt((float)value * num * mult);
	}

	private void PlaceMainObject(Encounter encounter, string factionSid, MapDescription.MainObject mainObject, bool isKeyObject, int zoneIndex)
	{
		bool num = mainObject.type == MainObjectType.City || mainObject.type == MainObjectType.Spawn || mainObject.type == MainObjectType.AbandonedOutpost;
		bool flag = mainObject.type == MainObjectType.GladiatorArena;
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, layout.Size);
		Vector2Int coords = encounter.template.buildings[0].position + vector2Int;
		if (num)
		{
			Vector2Int vector2Int2 = GridUtils.IndexToCoords(encounter.entrance, layout.Size);
			int num2 = GridUtils.CoordsToIndex(coords, layout.Size);
			bool flip = vector2Int2.x > coords.x + 1;
			if (vector2Int2.x == coords.x + 1)
			{
				flip = num2 % 2 == 0;
			}
			ConnectCityToRoad(encounter, flip);
			SquadParams? squadParamsForMainObject = GetSquadParamsForMainObject(mainObject);
			int id = mapObjectRegistry.AddCity(num2, flip, factionSid, squadParamsForMainObject, mainObject);
			if (isKeyObject)
			{
				mapObjectRegistry.AddKeyObject(id, zoneIndex);
			}
		}
		else if (flag)
		{
			coords += Vector2Int.one;
			int position = GridUtils.CoordsToIndex(coords, layout.Size);
			mapObjectRegistry.AddGladiatorArena(position);
		}
	}

	private void ConnectCityToRoad(Encounter encounter, bool flip)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, layout.Size);
		Vector2Int vector2Int2 = EncounterUtils.CityEntrance(encounter.template.buildings[0].position, flip);
		int index = GridUtils.CoordsToIndex(vector2Int + vector2Int2, layout.Size);
		RoadType? roadType = null;
		GridUtils.NeighboursIterator enumerator = GridUtils.GetNeighboursAll(index, layout.Size).GetEnumerator();
		while (enumerator.MoveNext())
		{
			int current = enumerator.Current;
			roadType = layout.GetRoadAt(current);
			if (roadType.HasValue)
			{
				break;
			}
		}
		if (roadType.HasValue)
		{
			Vector2Int coords = vector2Int + vector2Int2 + Vector2Int.up;
			mapData.SetRoad(GridUtils.CoordsToIndex(coords, layout.Size), GeneratorConfig.RoadIdByType(roadType.Value));
		}
	}

	private int PlaceBuilding(BuildingPlacementParams placement, ObjectConfig config, int variant, byte biome)
	{
		Encounter encounter = placement.encounter;
		int buildingSizeX = config.generatorConfig.buildingSizeX;
		int buildingSizeX2 = config.generatorConfig.buildingSizeX;
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounter.position, layout.Size);
		Vector2Int position = vector2Int + placement.positionInEncounter;
		int x = position.x;
		int num = position.x + buildingSizeX - 1;
		int y = position.y;
		int num2 = position.y + buildingSizeX2 - 1;
		BuildingSlot buildingSlot = encounter.template.buildings[placement.buildingIndex];
		Vector2Int vector2Int2 = vector2Int + buildingSlot.position;
		for (int i = vector2Int2.x; i < vector2Int2.x + buildingSlot.width; i++)
		{
			for (int j = vector2Int2.y; j < vector2Int2.y + buildingSlot.height; j++)
			{
				if (i < x || i > num || j < y || j > num2)
				{
					int num3 = GridUtils.CoordsToIndex(i, j, layout.Size);
					updatedObstaclesMap[num3] = ObstacleState.AlwaysObstacle;
				}
			}
		}
		return mapObjectRegistry.AddBuilding(config, variant, biome, position, placement.flip);
	}

	private int PlacePickup(ObjectConfig config, int variant, byte biome, ContentSlot slot)
	{
		int pickupPosition = slot.GetPickupPosition(layout.Size);
		return mapObjectRegistry.AddObject(config, variant, biome, new MapObjectPosition(pickupPosition));
	}

	private void PlaceSquad(int position, SquadParams squad)
	{
		if (squad.value != 0)
		{
			mapObjectRegistry.AddRandomSquad(position, squad);
			guardList.Add(new Guard(position, squad));
		}
	}

	private int CanFitBuildingIntoEncounter(Encounter encounter, int width, int height, InteractionLayout interaction)
	{
		for (int i = 0; i < encounter.template.buildings.Length; i++)
		{
			if (EncounterUtils.CanFitBuilding(encounter.template, i, width, height, interaction))
			{
				return i;
			}
		}
		return -1;
	}

	private bool TryFitBuildingIntoEncounter(out BuildingPlacementParams placement, Encounter encounter, int width, int height, InteractionLayout interaction)
	{
		for (int i = 0; i < encounter.template.buildings.Length; i++)
		{
			if (EncounterUtils.TryFitBuilding(out var position, out var flip, encounter.template, i, width, height, interaction))
			{
				placement = new BuildingPlacementParams(encounter, i, position, flip);
				return true;
			}
		}
		placement = default(BuildingPlacementParams);
		return false;
	}
}
