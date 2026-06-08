using System.Collections.Generic;
using Hex.Map;
using Unity.Profiling;
using UnityEngine;

namespace Hex.MapGenerator;

public class Generator
{
	public struct GeneratorResult
	{
		public MapData mapData;

		public Layout layout;

		public ContentPlacer contentPlacer;
	}

	private static ProfilerMarker FullProfilerMarker = new ProfilerMarker("GenerateMap");

	private static ProfilerMarker DescBuildProfilerMarker = new ProfilerMarker("GenerateMapDesc");

	private static ProfilerMarker LayoutProfilerMarker = new ProfilerMarker("GenerateLayout");

	private static ProfilerMarker ContentProfilerMarker = new ProfilerMarker("GenerateContent");

	private static GeneratorConfig config;

	public static GeneratorConfig GetConfig()
	{
		if (config == null)
		{
			config = new GeneratorConfig();
		}
		return config;
	}

	public static MetaInfo GetMetaInfo(string templateJson)
	{
		RandomMapTemplate randomMapTemplate = JsonUtility.FromJson<RandomMapTemplate>(templateJson);
		MetaInfo metaInfo = new MetaInfo();
		metaInfo.title = randomMapTemplate.name;
		metaInfo.desc = randomMapTemplate.description;
		metaInfo.descFromLocalization = true;
		metaInfo.displayWinCondition = randomMapTemplate.displayWinCondition;
		if (EnumParser.TryParceEnum<EMapGameMode>(randomMapTemplate.gameMode, out var value))
		{
			metaInfo.gameMode = value;
		}
		metaInfo.sizeX = randomMapTemplate.sizeX;
		metaInfo.sizeZ = randomMapTemplate.sizeZ;
		List<MapDataMiscSpawn> list = new List<MapDataMiscSpawn>();
		RandomMapTemplate.Zone[] zones = randomMapTemplate.variants[0].zones;
		for (int i = 0; i < zones.Length; i++)
		{
			RandomMapTemplate.MainObject[] mainObjects = zones[i].mainObjects;
			foreach (RandomMapTemplate.MainObject mainObject in mainObjects)
			{
				if (mainObject.type == MainObjectType.Spawn.ToString())
				{
					MapDataMiscSpawn mapDataMiscSpawn = new MapDataMiscSpawn();
					if (EnumParser.TryParceEnum<ESpawn>(mainObject.spawn, out var value2))
					{
						mapDataMiscSpawn.owner = (int)value2;
						mapDataMiscSpawn.spawnPointType = ESpawnPointType.City;
						list.Add(mapDataMiscSpawn);
					}
				}
			}
		}
		metaInfo.spawns.spawns = list.ToArray();
		metaInfo.spawns.playersCount = list.Count;
		metaInfo.banInfoData.bannedMagics = randomMapTemplate.globalBans.magics;
		metaInfo.banInfoData.bannedItems = randomMapTemplate.globalBans.items;
		metaInfo.banInfoData.bannedSkills = randomMapTemplate.globalBans.skills;
		metaInfo.banInfoData.bannedHeroes = randomMapTemplate.globalBans.heroes;
		metaInfo.banInfoData.bannedUnits = randomMapTemplate.globalBans.units;
		return metaInfo;
	}

	public static MapData GenerateMap(string templateJson, int seed, string[] spawnFactions)
	{
		return Generate(templateJson, seed, spawnFactions, 3, checksum: true, debugInfo: false).mapData;
	}

	public static GeneratorResult Generate(string templateJson, int seed, string[] spawnFactions, int maxAttempts, bool checksum, bool debugInfo)
	{
		GeneratorResult result = default(GeneratorResult);
		MapDescription mapDescription = null;
		int num = 0;
		while (num < maxAttempts)
		{
			try
			{
				mapDescription = MapDescriptionBuilder.Build(GetConfig(), templateJson, seed + num, spawnFactions);
			}
			catch (GeneratorException ex)
			{
				Log.ConfigError(ex.FormatMessage(mapDescription));
				Log.Error("Failed to generate template.");
				break;
			}
			try
			{
				Layout layout = Layout.Generate(GetConfig(), mapDescription, debugInfo);
				MapData mapData = new MapData();
				mapData.Create(mapDescription.sizeX, mapDescription.sizeZ);
				mapData.cliffRandomSeed = seed;
				ContentPlacer contentPlacer = new ContentPlacer(GetConfig(), mapDescription, layout, mapData);
				contentPlacer.Run(debugInfo);
				result.mapData = mapData;
				result.layout = layout;
				result.contentPlacer = contentPlacer;
				num++;
				if (contentPlacer.MissingMandatoryContent == 0 || num >= maxAttempts)
				{
					break;
				}
				continue;
			}
			catch (GeneratorException ex2)
			{
				num++;
				Log.ConfigError(ex2.FormatMessage(mapDescription));
				if (num >= maxAttempts)
				{
					Log.Error($"Failed to generate template {mapDescription.name} with seed {seed} in {maxAttempts} attempts.");
				}
				continue;
			}
		}
		if (checksum && result.mapData != null)
		{
			result.mapData.generatorChecksum = new Checksum().Compute(result.mapData);
		}
		return result;
	}
}
