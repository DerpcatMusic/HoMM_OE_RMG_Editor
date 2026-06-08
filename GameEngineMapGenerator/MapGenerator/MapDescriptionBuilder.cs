using System;
using System.Collections.Generic;
using Hex.Configs;
using Hex.Map;
using UnityEngine;

namespace Hex.MapGenerator;

public class MapDescriptionBuilder
{
	private struct FactionRuleData
	{
		public FactionRuleType type;

		public string[] factions;

		public int mainObjectIndex;

		public int zoneIndex;

		public (int mainObjectIndex, int zoneIndex)[] differentFrom;
	}

	private struct BiomeRuleData
	{
		public BiomeRuleType type;

		public string[] biomes;

		public int mainObjectIndex;

		public int zoneIndex;

		public (int mainObjectIndex, int zoneIndex)[] differentFrom;

		public static BiomeRuleData DefaultMetaRule()
		{
			return new BiomeRuleData
			{
				type = BiomeRuleType.MatchZone,
				zoneIndex = -1
			};
		}
	}

	public static MapDescription Build(GeneratorConfig generatorConfig, string templateJson, int seed, string[] spawnFactions)
	{
		MapDescription mapDescription = new MapDescription();
		System.Random random = new Rng(seed).Create();
		RandomMapTemplate randomMapTemplate = Parse(templateJson);
		TemplateContext ctx = new TemplateContext(randomMapTemplate, generatorConfig);
		int variant = random.Next(randomMapTemplate.variants.Length);
		FillTemplateParams(mapDescription, randomMapTemplate, variant, seed, ctx);
		CreateZones(mapDescription, randomMapTemplate, ctx, random);
		CreateConnections(mapDescription, randomMapTemplate);
		ParseRoads(mapDescription, randomMapTemplate);
		ParseRules(mapDescription);
		string[][] array = ResolveMainObjectFactions(generatorConfig.GetContent(), randomMapTemplate, variant, spawnFactions, random);
		(byte[], byte[], byte[]) tuple = ResolveBiomes(generatorConfig.GetContent(), randomMapTemplate, variant, array, random);
		byte[] item = tuple.Item1;
		byte[] item2 = tuple.Item2;
		byte[] item3 = tuple.Item3;
		for (int i = 0; i < mapDescription.zones.Count; i++)
		{
			MapDescription.Zone zone = mapDescription.zones[i];
			zone.zoneBiome = item[i];
			zone.contentBiome = item2[i];
			zone.metaObjectsBiome = item3[i];
			for (int j = 0; j < zone.mainObjects.Count; j++)
			{
				zone.mainObjects[j].faction = array[i][j];
			}
		}
		CheckResourceFractions(mapDescription);
		return mapDescription;
	}

	private static RandomMapTemplate Parse(string json)
	{
		RandomMapTemplate randomMapTemplate = JsonUtility.FromJson<RandomMapTemplate>(json);
		randomMapTemplate.jsonText = json;
		for (int i = 0; i < randomMapTemplate.variants.Length; i++)
		{
			RandomMapTemplate.Variant variant = randomMapTemplate.variants[i];
			if (!EnumParser.TryParceEnum<GraphOrientationMode>(variant.orientation.mode, out variant.orientation.modeEnum))
			{
				Log.ConfigError($"Couldn't parse orientation mode '{variant.orientation.mode}' in template '{randomMapTemplate.name}' v{i}.");
			}
			for (int j = 0; j < variant.zones.Length; j++)
			{
				RandomMapTemplate.Zone zone = variant.zones[j];
				RandomMapTemplate.MainObject[] mainObjects = zone.mainObjects;
				foreach (RandomMapTemplate.MainObject mainObject in mainObjects)
				{
					if (!EnumParser.TryParceEnum<MainObjectType>(mainObject.type, out mainObject.typeEnum))
					{
						Log.ConfigError($"Couldn't parse MainObject type in template '{randomMapTemplate.name}' v{i} in zone '{zone.name}'");
					}
					if (!EnumParser.TryParceEnum<MainObjectPlacement>(mainObject.placement, out mainObject.placementEnum))
					{
						Log.ConfigError($"Couldn't parse MainObject placement in template '{randomMapTemplate.name}' v{i} in zone '{zone.name}'");
					}
					if (mainObject.typeEnum == MainObjectType.Spawn)
					{
						if (mainObject.spawn == null)
						{
							throw new GeneratorException($"Spawn for MainObject is not specified '{randomMapTemplate.name}' v{i} in zone '{zone.name}'", Log.Context.none);
						}
						if (!EnumParser.TryParceEnum<ESpawn>(mainObject.spawn, out mainObject.spawnEnum))
						{
							throw new GeneratorException($"Couldn't parse MainObject spawn '{randomMapTemplate.name}' v{i}  in zone '{zone.name}'", Log.Context.none);
						}
					}
					if (mainObject.owner != null)
					{
						if (!EnumParser.TryParceEnum<ESpawn>(mainObject.owner, out var value))
						{
							throw new GeneratorException($"Couldn't parse MainObject owner '{randomMapTemplate.name}' v{i} in zone '{zone.name}'", Log.Context.none);
						}
						mainObject.ownerEnum = value;
					}
				}
			}
			for (int l = 0; l < variant.connections.Length; l++)
			{
				RandomMapTemplate.Connection conn = variant.connections[l];
				if (!EnumParser.TryParceEnum<ConnectionType>(conn.connectionType, out conn.connectionTypeEnum))
				{
					Log.ConfigError($"Couldn't parse Connection type '{conn.connectionType}' in template '{randomMapTemplate.name}' v{i}");
				}
				if (!EnumParser.TryParceEnum<ESquadReactionType>(conn.guardReaction, out conn.guardReactionEnum))
				{
					Log.ConfigError($"Couldn't parse connection guard reaction '{conn.guardReaction}' in template '{randomMapTemplate.name}' v{i}");
				}
				conn.indexFrom = Array.FindIndex(variant.zones, (RandomMapTemplate.Zone z) => z.name == conn.from);
				conn.indexTo = Array.FindIndex(variant.zones, (RandomMapTemplate.Zone z) => z.name == conn.to);
				if (conn.indexFrom == -1)
				{
					Log.ConfigError($"Connection from zone '{conn.from}' doesnt exist in '{randomMapTemplate.name}' v{i}");
				}
				if (conn.indexTo == -1)
				{
					Log.ConfigError($"Connection to zone '{conn.to}' doesnt exist in '{randomMapTemplate.name}' v{i}");
				}
				if (!EnumParser.TryParceEnum<GatePlacement>(conn.gatePlacement, out conn.gatePlacementEnum))
				{
					Log.ConfigError($"Couldn't parse Connection gate placement '{conn.gatePlacement}' in template '{randomMapTemplate.name}' v{i}");
				}
			}
		}
		RandomMapTemplate.MandatoryContentPreset[] mandatoryContent = randomMapTemplate.mandatoryContent;
		foreach (RandomMapTemplate.MandatoryContentPreset mandatoryContentPreset in mandatoryContent)
		{
			RandomMapTemplate.MandatoryContent[] content = mandatoryContentPreset.content;
			foreach (RandomMapTemplate.MandatoryContent mandatoryContent2 in content)
			{
				if (mandatoryContent2.owner != null)
				{
					if (!EnumParser.TryParceEnum<ESpawn>(mandatoryContent2.owner, out var value2))
					{
						throw new GeneratorException("Couldn't parse MandatoryContent owner '" + randomMapTemplate.name + "' in preset '" + mandatoryContentPreset.name + "'", Log.Context.none);
					}
					mandatoryContent2.ownerEnum = value2;
				}
			}
		}
		return randomMapTemplate;
	}

	private static void FillTemplateParams(MapDescription result, RandomMapTemplate template, int variant, int seed, TemplateContext ctx)
	{
		result.template = template;
		result.templateVariant = variant;
		result.name = template.name;
		result.sizeX = template.sizeX;
		result.sizeZ = template.sizeZ;
		result.seed = seed;
		result.orientation = template.variants[variant].orientation;
		result.border = template.variants[variant].border;
		result.river = template.variants[variant].river;
		result.gameRules = template.gameRules;
		result.valueOverrides = ctx.ValueOverrides;
		result.banInfo = ctx.BanInfo;
		result.heroPoolCount = ctx.HeroPoolCount;
	}

	private static void CreateZones(MapDescription result, RandomMapTemplate template, TemplateContext ctx, System.Random random)
	{
		result.zones = new List<MapDescription.Zone>();
		RandomMapTemplate.Zone[] zones = template.variants[result.templateVariant].zones;
		for (int i = 0; i < zones.Length; i++)
		{
			MapDescription.Zone zone = new MapDescription.Zone();
			result.zones.Add(zone);
			RandomMapTemplate.Zone zone2 = zones[i];
			zone.name = zone2.name;
			zone.size = zone2.size;
			zone.guardedContentValue = zone2.guardedContentValue;
			zone.guardedContentValuePerArea = zone2.guardedContentValuePerArea;
			zone.unguardedContentValue = zone2.unguardedContentValue;
			zone.unguardedContentValuePerArea = zone2.unguardedContentValuePerArea;
			zone.resourcesValue = zone2.resourcesValue;
			zone.resourcesValuePerArea = zone2.resourcesValuePerArea;
			zone.crossroadsPosition = zone2.crossroadsPosition;
			zone.randomHireEnableWeeklyUnitIncrement = zone2.randomHireEnableWeeklyUnitIncrement;
			zone.randomHireInitialUnitIncrement = zone2.randomHireInitialUnitIncrement;
			zone.diplomacyModifier = zone2.diplomacyModifier;
			zone.guardCutoffValue = zone2.guardCutoffValue;
			zone.guardMultiplier = zone2.guardMultiplier;
			zone.guardRandomization = zone2.guardRandomization;
			zone.guardWeeklyIncrement = zone2.guardWeeklyIncrement;
			zone.guardReactionDistribution = zone2.guardReactionDistribution;
			zone.encounterHolesSettings = zone2.encounterHolesSettings;
			zone.layout = ctx.GetZoneLayoutConfig(zone2.layout);
			zone.mainObjects = new List<MapDescription.MainObject>();
			RandomMapTemplate.MainObject[] mainObjects = zone2.mainObjects;
			foreach (RandomMapTemplate.MainObject mainObject in mainObjects)
			{
				MapDescription.MainObject mainObject2 = new MapDescription.MainObject();
				zone.mainObjects.Add(mainObject2);
				mainObject2.type = mainObject.typeEnum;
				mainObject2.spawn = mainObject.spawnEnum;
				mainObject2.owner = mainObject.ownerEnum;
				mainObject2.isKeyObject = mainObject.isKeyObject;
				mainObject2.enableWeeklyUnitIncrement = mainObject.enableWeeklyUnitIncrement;
				mainObject2.initialUnitIncrement = mainObject.initialUnitIncrement;
				mainObject2.guardChance = mainObject.guardChance;
				mainObject2.guardValue = mainObject.guardValue;
				mainObject2.guardWeeklyIncrement = mainObject.guardWeeklyIncrement;
				mainObject2.guardRandomization = mainObject.guardRandomization;
				mainObject2.removeGuardIfHasOwner = mainObject.removeGuardIfHasOwner;
				mainObject2.buildingsConstructionSid = mainObject.buildingsConstructionSid;
				mainObject2.buildingsBanSid = mainObject.buildingsBanSid;
				mainObject2.placement = mainObject.placementEnum;
				mainObject2.placementArgs = mainObject.placementArgs;
			}
			string id = zone2.guardedContentPool[random.Next(zone2.guardedContentPool.Length)];
			string id2 = zone2.unguardedContentPool[random.Next(zone2.unguardedContentPool.Length)];
			string id3 = zone2.resourcesContentPool[random.Next(zone2.resourcesContentPool.Length)];
			zone.guardedContentPool = ctx.GetContentPool(id);
			zone.unguardedContentPool = ctx.GetContentPool(id2);
			zone.resourcesContentPool = ctx.GetContentPool(id3);
			zone.contentCountLimits = new List<MapDescription.ContentCountLimit>();
			if (zone2.contentCountLimits.Length != 0)
			{
				string text = zone2.contentCountLimits[random.Next(zone2.contentCountLimits.Length)];
				if (ctx.ContentCountLimitPresets.TryGetById(text, out var value))
				{
					ContentCountLimit[] limits = value.limits;
					foreach (ContentCountLimit contentCountLimit in limits)
					{
						MapDescription.ContentCountLimit contentCountLimit2 = new MapDescription.ContentCountLimit();
						contentCountLimit2.sid = contentCountLimit.sid;
						contentCountLimit2.variant = contentCountLimit.variant;
						contentCountLimit2.biome = contentCountLimit.biome;
						contentCountLimit2.maxCount = contentCountLimit.maxCount;
						if (contentCountLimit.sid == null)
						{
							contentCountLimit2.content = new List<ContentID>();
							AddContentIDsFromLists(contentCountLimit2.content, contentCountLimit.includeLists);
						}
						zone.contentCountLimits.Add(contentCountLimit2);
					}
				}
				else
				{
					Log.ConfigError("Couldn't find content count limits preset " + text + ".");
				}
			}
			zone.mandatoryContent = new List<MapDescription.MandatoryContent>();
			if (zone2.mandatoryContent.Length == 0)
			{
				continue;
			}
			string text2 = zone2.mandatoryContent[random.Next(zone2.mandatoryContent.Length)];
			if (ctx.MandatoryContentPresets.TryGetById(text2, out var value2))
			{
				RandomMapTemplate.MandatoryContent[] content = value2.content;
				foreach (RandomMapTemplate.MandatoryContent mandatoryContent in content)
				{
					MapDescription.MandatoryContent mandatoryContent2 = new MapDescription.MandatoryContent();
					mandatoryContent2.name = mandatoryContent.name;
					if (mandatoryContent.sid == null)
					{
						mandatoryContent2.content = mandatoryContent.content ?? new List<ContentWeight>();
						AddContentFromLists(mandatoryContent2.content, mandatoryContent.includeLists);
					}
					else
					{
						mandatoryContent2.sid = mandatoryContent.sid;
						mandatoryContent2.variant = mandatoryContent.variant;
					}
					mandatoryContent2.designatedEncounter = mandatoryContent.designatedEncounter;
					mandatoryContent2.soloEncounter = mandatoryContent.soloEncounter;
					mandatoryContent2.isGuarded = mandatoryContent.isGuarded;
					mandatoryContent2.isMine = mandatoryContent.isMine;
					mandatoryContent2.owner = mandatoryContent.ownerEnum;
					mandatoryContent2.rules = new List<MapDescription.PlacementRule>();
					if (mandatoryContent.rules != null)
					{
						PlacementRule[] rules = mandatoryContent.rules;
						foreach (PlacementRule config in rules)
						{
							mandatoryContent2.rules.Add(new MapDescription.PlacementRule
							{
								config = config
							});
						}
					}
					zone.mandatoryContent.Add(mandatoryContent2);
				}
			}
			else
			{
				Log.ConfigError("Couldn't find mandatory content preset " + text2 + ".");
			}
		}
		result.orientation.zeroAngleZoneIndex = result.zones.FindIndex((MapDescription.Zone z) => z.name == result.orientation.zeroAngleZone);
		void AddContentFromLists(List<ContentWeight> dst, string[] lists)
		{
			if (lists != null)
			{
				foreach (string text3 in lists)
				{
					if (ctx.ContentLists.TryGetById(text3, out var value3))
					{
						foreach (ContentWeight item in value3.content)
						{
							dst.Add(item);
						}
					}
					else
					{
						Log.ConfigError("Couldn't find content list " + text3);
					}
				}
			}
		}
		void AddContentIDsFromLists(List<ContentID> dst, string[] lists)
		{
			if (lists != null)
			{
				foreach (string text3 in lists)
				{
					if (ctx.ContentLists.TryGetById(text3, out var value3))
					{
						foreach (ContentWeight item2 in value3.content)
						{
							dst.Add(new ContentID
							{
								sid = item2.sid,
								variant = item2.variant
							});
						}
					}
					else
					{
						Log.ConfigError("Couldn't find content list " + text3);
					}
				}
			}
		}
	}

	private static void CreateConnections(MapDescription result, RandomMapTemplate template)
	{
		result.connections = new List<MapDescription.Connection>();
		RandomMapTemplate.Connection[] connections = template.variants[result.templateVariant].connections;
		foreach (RandomMapTemplate.Connection connectionConfig in connections)
		{
			MapDescription.Connection connection = new MapDescription.Connection();
			result.connections.Add(connection);
			connection.name = connectionConfig.name;
			connection.from = connectionConfig.indexFrom;
			connection.to = connectionConfig.indexTo;
			connection.connectionType = connectionConfig.connectionTypeEnum;
			connection.portalFromEnabled = connectionConfig.portalFromEnabled;
			connection.portalToEnabled = connectionConfig.portalToEnabled;
			connection.length = connectionConfig.length;
			connection.guardValue = connectionConfig.guardValue;
			connection.guardWeeklyIncrement = connectionConfig.guardWeeklyIncrement;
			connection.guardReaction = connectionConfig.guardReactionEnum;
			connection.guardEscape = connectionConfig.guardEscape;
			connection.guardMatchGroup = connectionConfig.guardMatchGroup;
			connection.guardZone = result.zones.FindIndex((MapDescription.Zone z) => z.name == connectionConfig.guardZone);
			if (connection.guardZone != connection.from && connection.guardZone != connection.to)
			{
				connection.guardZone = -1;
			}
			connection.gatePlacement = connectionConfig.gatePlacementEnum;
			connection.gatePlacementArgs = connectionConfig.gatePlacementArgs;
			connection.portalPlacementRulesFrom = new List<MapDescription.PlacementRule>();
			if (connectionConfig.portalPlacementRulesFrom != null)
			{
				PlacementRule[] portalPlacementRulesFrom = connectionConfig.portalPlacementRulesFrom;
				foreach (PlacementRule config in portalPlacementRulesFrom)
				{
					connection.portalPlacementRulesFrom.Add(new MapDescription.PlacementRule
					{
						config = config
					});
				}
			}
			connection.portalPlacementRulesTo = new List<MapDescription.PlacementRule>();
			if (connectionConfig.portalPlacementRulesTo != null)
			{
				PlacementRule[] portalPlacementRulesFrom = connectionConfig.portalPlacementRulesTo;
				foreach (PlacementRule config2 in portalPlacementRulesFrom)
				{
					connection.portalPlacementRulesTo.Add(new MapDescription.PlacementRule
					{
						config = config2
					});
				}
			}
		}
	}

	private static void ParseRoads(MapDescription result, RandomMapTemplate template)
	{
		for (int i = 0; i < result.zones.Count; i++)
		{
			List<MapDescription.Road> list = new List<MapDescription.Road>();
			result.zones[i].roads = list;
			RoadConfig[] roads = template.variants[result.templateVariant].zones[i].roads;
			for (int j = 0; j < roads.Length; j++)
			{
				MapDescription.Road? road = ParseRoadData(roads[j], result, i);
				if (road.HasValue)
				{
					MapDescription.Road value = road.Value;
					list.Add(value);
					if (value.typeFrom == RoadTargetType.MandatoryContent)
					{
						result.zones[i].mandatoryContent[value.indexFrom].designatedEncounter = true;
					}
					if (value.typeTo == RoadTargetType.MandatoryContent)
					{
						result.zones[i].mandatoryContent[value.indexTo].designatedEncounter = true;
					}
				}
			}
		}
	}

	private static void ParseRules(MapDescription result)
	{
		for (int i = 0; i < result.zones.Count; i++)
		{
			foreach (MapDescription.MandatoryContent item in result.zones[i].mandatoryContent)
			{
				List<MapDescription.PlacementRule> rules = item.rules;
				item.rules = new List<MapDescription.PlacementRule>();
				foreach (MapDescription.PlacementRule item2 in rules)
				{
					if (PlacementRuleHandler.TryParseRule(item2.config, result, i, out var result2))
					{
						item.rules.Add(result2);
					}
				}
			}
		}
		for (int j = 0; j < result.connections.Count; j++)
		{
			MapDescription.Connection connection = result.connections[j];
			List<MapDescription.PlacementRule> portalPlacementRulesFrom = connection.portalPlacementRulesFrom;
			connection.portalPlacementRulesFrom = new List<MapDescription.PlacementRule>();
			foreach (MapDescription.PlacementRule item3 in portalPlacementRulesFrom)
			{
				if (PlacementRuleHandler.TryParseRule(item3.config, result, connection.from, out var result3))
				{
					connection.portalPlacementRulesFrom.Add(result3);
				}
			}
			List<MapDescription.PlacementRule> portalPlacementRulesTo = connection.portalPlacementRulesTo;
			connection.portalPlacementRulesTo = new List<MapDescription.PlacementRule>();
			foreach (MapDescription.PlacementRule item4 in portalPlacementRulesTo)
			{
				if (PlacementRuleHandler.TryParseRule(item4.config, result, connection.to, out var result4))
				{
					connection.portalPlacementRulesTo.Add(result4);
				}
			}
		}
	}

	private static MapDescription.Road? ParseRoadData(RoadConfig config, MapDescription mapDescription, int zoneIndex)
	{
		MapDescription.Road value = default(MapDescription.Road);
		EnumParser.TryParceEnum<RoadType>(config.type, out value.roadType);
		(RoadTargetType, int)? tuple = ParseRoadTarget(config.from, mapDescription, zoneIndex);
		if (!tuple.HasValue)
		{
			return null;
		}
		(RoadTargetType, int)? tuple2 = ParseRoadTarget(config.to, mapDescription, zoneIndex);
		if (!tuple2.HasValue)
		{
			return null;
		}
		ref RoadTargetType typeFrom = ref value.typeFrom;
		ref int indexFrom = ref value.indexFrom;
		(RoadTargetType, int) value2 = tuple.Value;
		typeFrom = value2.Item1;
		indexFrom = value2.Item2;
		ref RoadTargetType typeTo = ref value.typeTo;
		indexFrom = ref value.indexTo;
		(typeTo, indexFrom) = tuple2.Value;
		return value;
	}

	private static (RoadTargetType, int)? ParseRoadTarget(RoadTargetConfig config, MapDescription mapDescription, int zoneIndex)
	{
		if (!EnumParser.TryParceEnum<RoadTargetType>(config.type, out var value))
		{
			Log.ConfigError("Couldn't parse road target type '" + config.type + "' in template '" + mapDescription.name + "'.");
			return null;
		}
		switch (value)
		{
		case RoadTargetType.Crossroads:
			return (value, -1);
		case RoadTargetType.MainObject:
		{
			if (RuleParseUtils.TryParseMainObjectIndex(out var mainObjectIndex, out var error2, config.args, 0, mapDescription.zones[zoneIndex].mainObjects.Count))
			{
				return (value, mainObjectIndex);
			}
			LogRoadTargetError(mapDescription, zoneIndex, error2);
			break;
		}
		case RoadTargetType.Connection:
		{
			if (RuleParseUtils.TryParseConnectionIndex(out var connectionIndex, out var error3, config.args, 0, mapDescription, zoneIndex))
			{
				return (value, connectionIndex);
			}
			LogRoadTargetError(mapDescription, zoneIndex, error3);
			break;
		}
		case RoadTargetType.MandatoryContent:
		{
			if (RuleParseUtils.TryParseMandatoryContentIndex(out var contentIndex, out var error, config.args, 0, mapDescription.zones[zoneIndex].mandatoryContent, zoneIndex))
			{
				return (value, contentIndex);
			}
			LogRoadTargetError(mapDescription, zoneIndex, error);
			break;
		}
		}
		return null;
	}

	private static void LogRoadTargetError(MapDescription mapDescription, int zoneIndex, string error)
	{
		Log.ConfigError("Error in road target in template '" + mapDescription.name + "', zone '" + mapDescription.zones[zoneIndex].name + "': " + error + ".");
	}

	private static string[][] ResolveMainObjectFactions(ContentDatabase contentDatabase, RandomMapTemplate template, int variant, string[] spawnFactions, System.Random random)
	{
		RandomMapTemplate.Zone[] zones = template.variants[variant].zones;
		int zoneCount = zones.Length;
		string[][] array = new string[zoneCount][];
		List<string> factionsList = new List<string>();
		List<string> factionsList2 = new List<string>();
		List<string> list = new List<string>();
		int num = 0;
		int[] startByZone = new int[zoneCount];
		for (int i = 0; i < zoneCount; i++)
		{
			int num2 = zones[i].mainObjects.Length;
			num += num2;
			array[i] = new string[num2];
		}
		if (num == 0)
		{
			return array;
		}
		for (int j = 1; j < zoneCount; j++)
		{
			int num3 = zones[j - 1].mainObjects.Length;
			startByZone[j] = startByZone[j - 1] + num3;
		}
		bool[] array2 = new bool[num];
		FactionRuleData[] array3 = new FactionRuleData[num];
		string[] array4 = new string[num];
		for (int k = 0; k < zoneCount; k++)
		{
			RandomMapTemplate.Zone obj = zones[k];
			RandomMapTemplate.MainObject[] mainObjects = obj.mainObjects;
			int num4 = obj.mainObjects.Length;
			for (int l = 0; l < num4; l++)
			{
				RandomMapTemplate.MainObject mainObject = mainObjects[l];
				int num5 = (int)(mainObject.spawnEnum - 1);
				bool num6 = mainObject.typeEnum == MainObjectType.Spawn && spawnFactions != null && num5 < spawnFactions.Length && !string.IsNullOrEmpty(spawnFactions[num5]);
				int num7 = Index(k, l);
				if (num6)
				{
					array4[num7] = spawnFactions[num5];
					array3[num7] = default(FactionRuleData);
				}
				else
				{
					array3[num7] = ParseFactionRule(mainObject.faction, template, variant, k, l).GetValueOrDefault();
				}
			}
		}
		Stack<(int, bool)> stack = new Stack<(int, bool)>();
		for (int m = 0; m < num; m++)
		{
			if (array4[m] != null)
			{
				continue;
			}
			string text = null;
			Utils.FillArray(array2, value: false);
			stack.Push((m, false));
			while (stack.Count > 0)
			{
				var (num8, flag) = stack.Peek();
				if (array4[num8] != null)
				{
					stack.Pop();
					if (flag)
					{
						text = array4[num8];
					}
					continue;
				}
				FactionRuleData factionRuleData = array3[num8];
				bool flag2 = false;
				if (factionRuleData.type == FactionRuleType.FromList)
				{
					list.Clear();
					if (factionRuleData.differentFrom != null)
					{
						(int, int)[] differentFrom = factionRuleData.differentFrom;
						for (int n = 0; n < differentFrom.Length; n++)
						{
							(int, int) tuple2 = differentFrom[n];
							int item = tuple2.Item1;
							int num9 = Index(tuple2.Item2, item);
							if (array4[num9] == null)
							{
								stack.Push((num9, false));
								flag2 = true;
							}
							else
							{
								list.Add(array4[num9]);
							}
						}
					}
				}
				if (factionRuleData.type == FactionRuleType.Match && text == null)
				{
					if (factionRuleData.zoneIndex == -1)
					{
						int item2 = FromIndex(num8).Item1;
						stack.Push((Index(item2, factionRuleData.mainObjectIndex), true));
					}
					else
					{
						stack.Push((Index(factionRuleData.zoneIndex, factionRuleData.mainObjectIndex), true));
					}
					flag2 = true;
				}
				if (array2[num8] && flag2)
				{
					var (num10, num11) = FromIndex(num8);
					throw new GeneratorException($"Circular dependency in main object factions starting at v{variant} {zones[num10].name}, {num11}.", Log.Context.none);
				}
				array2[num8] = true;
				if (!flag2)
				{
					if (factionRuleData.type == FactionRuleType.FromList)
					{
						array4[num8] = RollFaction(factionRuleData.factions, list);
					}
					if (factionRuleData.type == FactionRuleType.Match)
					{
						array4[num8] = text;
						text = null;
					}
					stack.Pop();
					if (flag)
					{
						text = array4[num8];
					}
				}
			}
		}
		int num12 = 0;
		for (int num13 = 0; num13 < zoneCount; num13++)
		{
			int num14 = zones[num13].mainObjects.Length;
			for (int num15 = 0; num15 < num14; num15++)
			{
				array[num13][num15] = array4[num12];
				num12++;
			}
		}
		return array;
		(int, int) FromIndex(int index)
		{
			for (int num16 = 1; num16 < zoneCount; num16++)
			{
				if (index < startByZone[num16])
				{
					return (num16 - 1, index - startByZone[num16 - 1]);
				}
			}
			return (zoneCount - 1, index - startByZone[zoneCount - 1]);
		}
		int Index(int zone, int num16)
		{
			return startByZone[zone] + num16;
		}
		string RollFaction(string[] factions, List<string> excludeFactions)
		{
			factionsList.Clear();
			factionsList2.Clear();
			contentDatabase.FilterFactions(factionsList2, factions);
			if (factionsList2.Count == 0)
			{
				factionsList2.AddRange(contentDatabase.AvailableFactions());
			}
			foreach (string item3 in factionsList2)
			{
				if (!excludeFactions.Contains(item3))
				{
					factionsList.Add(item3);
				}
			}
			if (factionsList.Count == 0)
			{
				return contentDatabase.GetRandomFaction(random);
			}
			return factionsList[random.Next(factionsList.Count)];
		}
	}

	private static (byte[], byte[], byte[]) ResolveBiomes(ContentDatabase contentDatabase, RandomMapTemplate template, int variant, string[][] mainObjectFactions, System.Random random)
	{
		RandomMapTemplate.Zone[] zones = template.variants[variant].zones;
		int num = zones.Length;
		byte[] zoneBiomes = new byte[num];
		byte[] array = new byte[num];
		byte[] array2 = new byte[num];
		bool[] array3 = new bool[num];
		bool[] defined = new bool[num];
		Stack<(int, bool)> stack = new Stack<(int, bool)>();
		List<byte> biomesList = new List<byte>();
		List<byte> excludeBiomes = new List<byte>();
		BiomeRuleData[] array4 = new BiomeRuleData[num];
		for (int i = 0; i < num; i++)
		{
			BiomeRuleData? biomeRuleData = ParseBiomeRule(zones[i].zoneBiome, template, variant, i);
			array4[i] = (biomeRuleData.HasValue ? biomeRuleData.Value : default(BiomeRuleData));
		}
		for (int j = 0; j < num; j++)
		{
			if (defined[j])
			{
				continue;
			}
			byte? b = null;
			Utils.FillArray(array3, value: false);
			stack.Push((j, false));
			while (stack.Count > 0)
			{
				var (num2, flag) = stack.Peek();
				if (defined[num2])
				{
					stack.Pop();
					if (flag)
					{
						b = zoneBiomes[num2];
					}
					continue;
				}
				BiomeRuleData rule = array4[num2];
				bool flag2 = false;
				if (rule.type == BiomeRuleType.FromList && rule.differentFrom != null)
				{
					(int, int)[] differentFrom = rule.differentFrom;
					for (int k = 0; k < differentFrom.Length; k++)
					{
						var (num3, num4) = differentFrom[k];
						if (num3 == -1 && !defined[num4])
						{
							stack.Push((num4, false));
							flag2 = true;
						}
					}
				}
				if (rule.type == BiomeRuleType.MatchZone && rule.zoneIndex >= 0 && !b.HasValue)
				{
					stack.Push((rule.zoneIndex, true));
					flag2 = true;
				}
				if (array3[num2] && flag2)
				{
					throw new GeneratorException("Circular dependency in zone biome starting at " + zones[j].name + ".", Log.Context.none);
				}
				array3[num2] = true;
				if (flag2)
				{
					continue;
				}
				if (rule.type == BiomeRuleType.FromList)
				{
					FillExcludeBiomes(rule);
					zoneBiomes[num2] = RollRandomBiome(rule.biomes, excludeBiomes);
				}
				if (rule.type == BiomeRuleType.MatchMainObject)
				{
					int num5 = ((rule.zoneIndex < 0) ? num2 : rule.zoneIndex);
					zoneBiomes[num2] = contentDatabase.GetBiomeIdForFaction(mainObjectFactions[num5][rule.mainObjectIndex]);
				}
				if (rule.type == BiomeRuleType.MatchZone)
				{
					if (rule.zoneIndex == -1)
					{
						excludeBiomes.Clear();
						zoneBiomes[num2] = RollRandomBiome(rule.biomes, excludeBiomes);
					}
					else
					{
						zoneBiomes[num2] = b.Value;
						b = null;
					}
				}
				stack.Pop();
				defined[num2] = true;
				if (flag)
				{
					b = zoneBiomes[num2];
				}
			}
		}
		for (int l = 0; l < num; l++)
		{
			RandomMapTemplate.Zone zone = zones[l];
			array[l] = ApplyMetaBiomeRule(zone.contentBiome, l);
			array2[l] = ApplyMetaBiomeRule(zone.metaObjectsBiome, l);
		}
		return (zoneBiomes, array, array2);
		byte ApplyMetaBiomeRule(BiomeRule biomeRule, int zoneIndex)
		{
			BiomeRuleData rule2 = ParseBiomeRule(biomeRule, template, variant, zoneIndex) ?? BiomeRuleData.DefaultMetaRule();
			switch (rule2.type)
			{
			case BiomeRuleType.FromList:
				FillExcludeBiomes(rule2);
				return RollRandomBiome(rule2.biomes, excludeBiomes);
			case BiomeRuleType.MatchZone:
			{
				int num7 = ((rule2.zoneIndex == -1) ? zoneIndex : rule2.zoneIndex);
				return zoneBiomes[num7];
			}
			case BiomeRuleType.MatchMainObject:
			{
				int num6 = ((rule2.zoneIndex == -1) ? zoneIndex : rule2.zoneIndex);
				return contentDatabase.GetBiomeIdForFaction(mainObjectFactions[num6][rule2.mainObjectIndex]);
			}
			default:
				return 0;
			}
		}
		bool FillExcludeBiomes(BiomeRuleData biomeRuleData2)
		{
			excludeBiomes.Clear();
			if (biomeRuleData2.differentFrom == null || biomeRuleData2.differentFrom.Length == 0)
			{
				return true;
			}
			(int, int)[] differentFrom2 = biomeRuleData2.differentFrom;
			for (int m = 0; m < differentFrom2.Length; m++)
			{
				var (num6, num7) = differentFrom2[m];
				if (num6 == -1)
				{
					if (!defined[num7])
					{
						return false;
					}
					excludeBiomes.Add(zoneBiomes[num7]);
				}
				else
				{
					excludeBiomes.Add(contentDatabase.GetBiomeIdForFaction(mainObjectFactions[num7][num6]));
				}
			}
			return true;
		}
		byte RollRandomBiome(string[] biomes, List<byte> list)
		{
			biomesList.Clear();
			if (Utils.IsArrayNullOrEmpty(biomes))
			{
				foreach (TileConfig biome in contentDatabase.GetBiomes())
				{
					if (!list.Contains(biome.id))
					{
						biomesList.Add(biome.id);
					}
				}
			}
			else
			{
				foreach (string biomeSid in biomes)
				{
					byte id = contentDatabase.GetTileConfigByBiomeSid(biomeSid).id;
					if (!list.Contains(id))
					{
						biomesList.Add(id);
					}
				}
			}
			if (biomesList.Count > 0)
			{
				return biomesList[random.Next(biomesList.Count)];
			}
			return contentDatabase.GetBiomes()[random.Next(contentDatabase.GetBiomesCount())].id;
		}
	}

	private static BiomeRuleData? ParseBiomeRule(BiomeRule rule, RandomMapTemplate template, int variant, int zoneIndex)
	{
		BiomeRuleData value = new BiomeRuleData
		{
			zoneIndex = -1,
			mainObjectIndex = -1
		};
		int mainObjectCount = template.variants[variant].zones[zoneIndex].mainObjects.Length;
		if (!EnumParser.TryParceEnum<BiomeRuleType>(rule.type, out value.type))
		{
			Log.ConfigError("Couldn't parse rule type '" + rule.type + "' in template '" + template.name + "'.");
			return null;
		}
		switch (value.type)
		{
		case BiomeRuleType.FromList:
		{
			if (rule.args == null)
			{
				break;
			}
			List<string> list = new List<string>();
			List<(int, int)> list2 = new List<(int, int)>();
			string[] args = rule.args;
			foreach (string text in args)
			{
				if (text.StartsWith("differentFrom:"))
				{
					string[] array = text.Split(' ');
					int zoneIndex2 = -1;
					string error5;
					if (RuleParseUtils.TryParseMainObjectIndex(out var mainObjectIndex, out var _, array, 1, mainObjectCount))
					{
						if (array.Length > 2 && !RuleParseUtils.TryParseZoneIndex(out zoneIndex2, out var error4, array, 2, template, variant))
						{
							LogBiomeRuleError(template, variant, zoneIndex, error4);
							return null;
						}
					}
					else if (!RuleParseUtils.TryParseZoneIndex(out zoneIndex2, out error5, array, 1, template, variant))
					{
						LogBiomeRuleError(template, variant, zoneIndex, error5);
						return null;
					}
					if (mainObjectIndex != -1 && zoneIndex2 == -1)
					{
						zoneIndex2 = zoneIndex;
					}
					if (zoneIndex2 != -1 || mainObjectIndex != -1)
					{
						list2.Add((mainObjectIndex, zoneIndex2));
					}
				}
				else
				{
					list.Add(text);
				}
			}
			value.biomes = list.ToArray();
			value.differentFrom = list2.ToArray();
			break;
		}
		case BiomeRuleType.MatchZone:
		{
			if (rule.args != null && rule.args.Length != 0 && !RuleParseUtils.TryParseZoneIndex(out value.zoneIndex, out var error6, rule.args, 0, template, variant))
			{
				LogBiomeRuleError(template, variant, zoneIndex, error6);
				return null;
			}
			break;
		}
		case BiomeRuleType.MatchMainObject:
		{
			if (!RuleParseUtils.TryParseMainObjectIndex(out value.mainObjectIndex, out var error, rule.args, 0, template.variants[variant].zones[zoneIndex].mainObjects.Length))
			{
				LogBiomeRuleError(template, variant, zoneIndex, error);
				return null;
			}
			if (rule.args != null && rule.args.Length > 1 && !RuleParseUtils.TryParseZoneIndex(out value.zoneIndex, out var error2, rule.args, 1, template, variant))
			{
				LogBiomeRuleError(template, variant, zoneIndex, error2);
				return null;
			}
			break;
		}
		}
		return value;
	}

	private static void LogBiomeRuleError(RandomMapTemplate template, int variant, int zoneIndex, string error)
	{
		Log.ConfigError($"Error in biome rule in template '{template.name}' v{variant}, zone '{template.variants[variant].zones[zoneIndex].name}': {error}.");
	}

	private static FactionRuleData? ParseFactionRule(FactionRule rule, RandomMapTemplate template, int variant, int zoneIndex, int mainObjectIndex)
	{
		FactionRuleData value = new FactionRuleData
		{
			zoneIndex = -1
		};
		int mainObjectCount = template.variants[variant].zones[zoneIndex].mainObjects.Length;
		if (!EnumParser.TryParceEnum<FactionRuleType>(rule.type, out value.type))
		{
			Log.ConfigError("Couldn't parse rule type '" + rule.type + "' in template '" + template.name + "'.");
			return null;
		}
		switch (value.type)
		{
		case FactionRuleType.FromList:
		{
			if (rule.args == null)
			{
				break;
			}
			List<string> list = new List<string>();
			List<(int, int)> list2 = new List<(int, int)>();
			string[] args = rule.args;
			foreach (string text in args)
			{
				if (text.StartsWith("differentFrom:"))
				{
					string[] array = text.Split(' ');
					int zoneIndex2 = -1;
					if (!RuleParseUtils.TryParseMainObjectIndex(out var mainObjectIndex2, out var error3, array, 1, mainObjectCount))
					{
						LogFactionRuleError(template, variant, zoneIndex, mainObjectIndex, error3);
						return null;
					}
					if (array.Length > 2 && !RuleParseUtils.TryParseZoneIndex(out zoneIndex2, out var error4, array, 2, template, variant))
					{
						LogFactionRuleError(template, variant, zoneIndex, mainObjectIndex, error4);
						return null;
					}
					if (mainObjectIndex2 != -1)
					{
						if (zoneIndex2 == -1)
						{
							zoneIndex2 = zoneIndex;
						}
						list2.Add((mainObjectIndex2, zoneIndex2));
					}
				}
				else
				{
					list.Add(text);
				}
			}
			value.factions = list.ToArray();
			value.differentFrom = list2.ToArray();
			break;
		}
		case FactionRuleType.Match:
		{
			if (!RuleParseUtils.TryParseMainObjectIndex(out value.mainObjectIndex, out var error, rule.args, 0, mainObjectCount))
			{
				LogFactionRuleError(template, variant, zoneIndex, mainObjectIndex, error);
				return null;
			}
			if (rule.args != null && rule.args.Length > 1 && !RuleParseUtils.TryParseZoneIndex(out value.zoneIndex, out var error2, rule.args, 1, template, variant))
			{
				LogFactionRuleError(template, variant, zoneIndex, mainObjectIndex, error2);
			}
			break;
		}
		}
		return value;
	}

	private static void LogFactionRuleError(RandomMapTemplate template, int variant, int zoneIndex, int mapObjectIndex, string error)
	{
		Log.ConfigError($"Error in faction rule in template '{template.name}' v{variant}, zone '{template.variants[variant].zones[zoneIndex].name}', mainObject {mapObjectIndex}: {error}.");
	}

	private static void CheckResourceFractions(MapDescription desc)
	{
		for (int i = 0; i < desc.zones.Count; i++)
		{
			MapDescription.Zone zone = desc.zones[i];
			ResourceFractionDistribution guardedEncounterResourceFractions = zone.layout.guardedEncounterResourceFractions;
			if (guardedEncounterResourceFractions.countBounds.Length + 1 != guardedEncounterResourceFractions.fractions.Length)
			{
				throw new GeneratorException("Ivalid bracket count for resource fractions in template '" + desc.name + "', zone '" + zone.name + "'", Log.Context.none);
			}
			for (int j = 1; j < guardedEncounterResourceFractions.countBounds.Length; j++)
			{
				if (guardedEncounterResourceFractions.countBounds[j - 1] > guardedEncounterResourceFractions.countBounds[j])
				{
					throw new GeneratorException("Ivalid brackets for resource fractions in template '" + desc.name + "', zone '" + zone.name + "'", Log.Context.none);
				}
			}
		}
	}
}
