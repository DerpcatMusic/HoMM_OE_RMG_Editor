using System;
using System.Collections.Generic;
using System.IO;
using Hex.Configs;
using Hex.Mods;

namespace Hex.MapGenerator;

public class GeneratorConfig
{
	private GeneratorSettings settings;

	private ConfigsCollection<ZoneLayoutConfig> zoneLayoutConfigs;

	private ConfigsCollection<ContentPoolConfig> contentPoolConfigs;

	private ConfigsCollection<ContentList> contentLists;

	private List<EncounterTemplate> encounterTemplatesList;

	private EncounterTemplatesDatabase encounters;

	private ContentDatabase content;

	private EnvironmentAssets environmentAssets;

	private StatisticsConfig statisticsConfig;

	public const string SpawnSid = "city-spawner";

	public const string RandomSquadSid = "random-squad";

	public const string RandomCitySid = "random-city";

	public const string RandomItemSid = "random-item";

	public const string RandomHireSid = "random-hire";

	public const string AbandonedOutpostSid = "abandoned_outpost";

	public const string PrisonSid = "prison";

	public const string TavernSid = "tavern";

	public const string BridgeWoodSid = "bridge_wood";

	public const string BridgeStoneSid = "bridge_stone";

	public const string GladiatorArenaSid = "gladiator_arena";

	public const string InteractTag = "Interact";

	public const string ResourceTag = "Resource";

	public const string ArtifactTag = "Artifact";

	public GeneratorConfig()
	{
		zoneLayoutConfigs = new ConfigsCollection<ZoneLayoutConfig>((ZoneLayoutConfig c) => c.name);
		contentLists = new ConfigsCollection<ContentList>((ContentList c) => c.name);
		contentPoolConfigs = new ConfigsCollection<ContentPoolConfig>((ContentPoolConfig c) => c.name);
		encounterTemplatesList = new List<EncounterTemplate>();
		Mod[] array = Hex.Mods.Mods.array;
		foreach (Mod mod in array)
		{
			ConfigsLoader.LoadFromFile(mod.path + "/generator/generator_config.json", ref settings);
			ConfigsLoader.LoadFromFile(mod.path + "/generator/generator_stats_config.json", ref statisticsConfig);
			ConfigsLoader.LoadFromFile(mod.path + "/generator/generator_environment_assets.json", ref environmentAssets);
			ConfigsLoader.LoadFromFolder(mod.path + "/generator/encounter_templates", encounterTemplatesList);
			zoneLayoutConfigs.LoadFromFolder(mod.path + "/generator/zone_layouts");
			contentLists.LoadFromFolder(mod.path + "/generator/content_lists");
			contentPoolConfigs.LoadFromFolder(mod.path + "/generator/content_pools");
		}
	}

	public GeneratorSettings GetSettings()
	{
		return settings;
	}

	public StatisticsConfig GetStatsConfig()
	{
		return statisticsConfig;
	}

	public ConfigsCollection<ZoneLayoutConfig> GetZoneLayoutConfigs()
	{
		return zoneLayoutConfigs;
	}

	public ConfigsCollection<ContentPoolConfig> GetContentPoolConfigs()
	{
		return contentPoolConfigs;
	}

	public ConfigsCollection<ContentList> GetContentLists()
	{
		return contentLists;
	}

	public EncounterTemplatesDatabase GetEncounters()
	{
		if (encounters == null)
		{
			encounters = new EncounterTemplatesDatabase(encounterTemplatesList);
		}
		return encounters;
	}

	public ContentDatabase GetContent()
	{
		if (content == null)
		{
			content = new ContentDatabase(this);
		}
		return content;
	}

	public EnvironmentAssets GetEnvironmentAssets()
	{
		return environmentAssets;
	}

	public bool TryGetMapTemplateJsonByName(string name, out string json)
	{
		json = null;
		Mod[] array = Hex.Mods.Mods.array;
		foreach (Mod mod in array)
		{
			try
			{
				json = File.ReadAllText(mod.path + "/map_templates/" + name + ".rmg.json");
				if (!string.IsNullOrEmpty(json))
				{
					return true;
				}
			}
			catch
			{
			}
		}
		return !string.IsNullOrEmpty(json);
	}

	public string GetWaterForBiome(string biome)
	{
		int num = Array.FindIndex(settings.waterForBiome, (GeneratorSettings.StringPair el) => el.key == biome);
		if (num >= 0)
		{
			return settings.waterForBiome[num].val;
		}
		return null;
	}

	public string GetBiomeForWater(string water)
	{
		int num = Array.FindIndex(settings.waterForBiome, (GeneratorSettings.StringPair el) => el.val == water);
		if (num >= 0)
		{
			return settings.waterForBiome[num].key;
		}
		return null;
	}

	public string GetResourceForMine(string mineSid)
	{
		int num = Array.FindIndex(settings.resourceByMine, (GeneratorSettings.StringPair el) => el.key == mineSid);
		if (num >= 0)
		{
			return settings.resourceByMine[num].val;
		}
		return null;
	}

	public static void GetHeroHireBans(List<ContentID> list, HashSet<string> set)
	{
		if (list != null)
		{
			list.Add(new ContentID
			{
				sid = "tavern"
			});
			list.Add(new ContentID
			{
				sid = "prison"
			});
		}
		if (set != null)
		{
			set.Add("tavern");
			set.Add("prison");
		}
	}

	public static byte RoadIdByType(RoadType roadType)
	{
		return roadType switch
		{
			RoadType.Dirt => 1, 
			RoadType.Stone => 2, 
			_ => 0, 
		};
	}
}
