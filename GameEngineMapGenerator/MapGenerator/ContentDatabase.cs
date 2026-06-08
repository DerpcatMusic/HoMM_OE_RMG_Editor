using System;
using System.Collections.Generic;
using Hex.Configs;
using Hex.Map;
using Hex.Session.Data;

namespace Hex.MapGenerator;

public class ContentDatabase
{
	private readonly GeneratorConfig config;

	private Dictionary<string, MetaObjectDesc> metaObjectsBySid;

	private Dictionary<string, int> biomeIndexBySid;

	private List<float> tempWeights = new List<float>();

	private byte[] waterIdByBiomeID = new byte[256];

	private byte[] biomeIndexByID = new byte[256];

	public Dictionary<string, MetaObjectDesc> MetaObjectsBySid => metaObjectsBySid;

	public ContentDatabase(GeneratorConfig config)
	{
		this.config = config;
		biomeIndexBySid = new Dictionary<string, int>();
		for (int i = 0; i < GetBiomesCount(); i++)
		{
			TileConfig tileConfig = MapConfig.me.tiles.list[i];
			biomeIndexBySid.Add(tileConfig.biome, i);
			biomeIndexByID[tileConfig.id] = (byte)i;
		}
		for (int j = 0; j < GetBiomesCount(); j++)
		{
			TileConfig tileConfig2 = MapConfig.me.tiles.list[j];
			string biome = tileConfig2.biome;
			string waterForBiome = config.GetWaterForBiome(biome);
			if (waterForBiome != null)
			{
				waterIdByBiomeID[tileConfig2.id] = GetWaterConfigByName(waterForBiome).id;
			}
			else
			{
				Log.ConfigError("Can't find water for biome '" + biome + "'");
			}
		}
		MetaObjectConfig[] metaObjects = config.GetSettings().metaObjects;
		metaObjectsBySid = new Dictionary<string, MetaObjectDesc>(metaObjects.Length);
		MetaObjectConfig[] array = metaObjects;
		foreach (MetaObjectConfig metaObjectConfig in array)
		{
			if (!EnumParser.TryParceEnum<MetaObjectType>(metaObjectConfig.type, out var value))
			{
				Log.ConfigError("Couldn't parse meta object type in '" + metaObjectConfig.sid + "'");
			}
			MetaObjectDesc value2;
			if (value != MetaObjectType.RandomItem)
			{
				if (value != MetaObjectType.RandomHire)
				{
					continue;
				}
				value2 = new RandomHireMetaObject(metaObjectConfig);
			}
			else
			{
				value2 = new RandomItemMetaObject(metaObjectConfig);
			}
			metaObjectsBySid.Add(metaObjectConfig.sid, value2);
		}
	}

	public MapObjectDesc GetMapObjectDesc(string sid, int variant)
	{
		ObjectConfig mapObjectConfig;
		if (metaObjectsBySid.TryGetValue(sid, out var value))
		{
			mapObjectConfig = GetMapObjectConfig(value.mapObjectSid);
			return new MapObjectDesc(mapObjectConfig, null, -1, value);
		}
		mapObjectConfig = GetMapObjectConfig(sid);
		ObjConfigBase logicConfig = GetLogicConfig(sid);
		if (logicConfig == null)
		{
			return new MapObjectDesc(mapObjectConfig, null, -1, null);
		}
		ObjVariantConfig[] objVariants = logicConfig.GetObjVariants();
		if (objVariants == null || objVariants.Length == 0)
		{
			if (variant >= 0)
			{
				Log.ConfigError($"'{sid}' doesn't have a variant with index {variant}.");
			}
			return new MapObjectDesc(mapObjectConfig, logicConfig, -1, null);
		}
		bool num = variant >= objVariants.Length;
		if (num)
		{
			Log.ConfigError($"'{sid}' doesn't have a variant with index {variant}.");
		}
		if (num || variant < 0)
		{
			return new MapObjectDesc(mapObjectConfig, logicConfig, 0, null);
		}
		return new MapObjectDesc(mapObjectConfig, logicConfig, variant, null);
	}

	public MapObjectDesc GetMapObjectDescRollSpecific(string sid, int variant, Random random)
	{
		ObjectConfig mapObjectConfig;
		if (metaObjectsBySid.TryGetValue(sid, out var value))
		{
			mapObjectConfig = GetMapObjectConfig(value.mapObjectSid);
			return new MapObjectDesc(mapObjectConfig, null, -1, value);
		}
		mapObjectConfig = GetMapObjectConfig(sid);
		ObjConfigBase logicConfig = GetLogicConfig(sid);
		if (logicConfig == null)
		{
			return new MapObjectDesc(mapObjectConfig, null, -1, null);
		}
		ObjVariantConfig[] objVariants = logicConfig.GetObjVariants();
		if (objVariants == null || objVariants.Length == 0)
		{
			if (variant >= 0)
			{
				Log.ConfigError($"'{sid}' doesn't have a variant with index {variant}.");
			}
			return new MapObjectDesc(mapObjectConfig, logicConfig, -1, null);
		}
		if (variant < 0)
		{
			tempWeights.Clear();
			float num = 0f;
			for (int i = 0; i < objVariants.Length; i++)
			{
				num += (float)objVariants[i].rollChance;
			}
			for (int j = 0; j < objVariants.Length; j++)
			{
				tempWeights.Add((float)objVariants[j].rollChance / num);
			}
			int variant2 = RngUtils.WeightedIndex(tempWeights, random);
			return new MapObjectDesc(mapObjectConfig, logicConfig, variant2, null);
		}
		return new MapObjectDesc(mapObjectConfig, logicConfig, variant, null);
	}

	public void GetMapObjectDescAllVariants(List<MapObjectDesc> descs, List<float> normalizedRollChance, out ObjVariantConfig[] variants, string sid)
	{
		variants = null;
		descs.Clear();
		normalizedRollChance.Clear();
		ObjectConfig mapObjectConfig;
		if (metaObjectsBySid.TryGetValue(sid, out var value))
		{
			mapObjectConfig = GetMapObjectConfig(value.mapObjectSid);
			descs.Add(new MapObjectDesc(mapObjectConfig, null, -1, value));
			normalizedRollChance.Add(1f);
			return;
		}
		mapObjectConfig = GetMapObjectConfig(sid);
		ObjConfigBase logicConfig = GetLogicConfig(sid);
		if (logicConfig == null)
		{
			descs.Add(new MapObjectDesc(mapObjectConfig, null, -1, value));
			normalizedRollChance.Add(1f);
			return;
		}
		variants = logicConfig.GetObjVariants();
		if (variants == null || variants.Length == 0)
		{
			descs.Add(new MapObjectDesc(mapObjectConfig, logicConfig, -1, null));
			normalizedRollChance.Add(1f);
			return;
		}
		float num = 0f;
		for (int i = 0; i < variants.Length; i++)
		{
			num += (float)variants[i].rollChance;
		}
		for (int j = 0; j < variants.Length; j++)
		{
			descs.Add(new MapObjectDesc(mapObjectConfig, logicConfig, j, null));
			normalizedRollChance.Add((float)variants[j].rollChance / num);
		}
	}

	public int GetVariantCount(string sid)
	{
		if (metaObjectsBySid.TryGetValue(sid, out var _))
		{
			return 0;
		}
		if (GetMapObjectConfig(sid) == null)
		{
			return 0;
		}
		ObjConfigBase logicConfig = GetLogicConfig(sid);
		if (logicConfig == null)
		{
			return 0;
		}
		ObjVariantConfig[] objVariants = logicConfig.GetObjVariants();
		if (objVariants == null)
		{
			return 0;
		}
		return objVariants.Length;
	}

	public static bool MapObjectHasTag(MapObjectDesc desc, string tag)
	{
		return desc.mapConfig.tag == tag;
	}

	public static bool IsMapObjectBuilding(MapObjectDesc desc)
	{
		if (desc.metaObjectDesc != null)
		{
			return desc.metaObjectDesc.isBuilding;
		}
		return MapObjectHasTag(desc, "Interact");
	}

	public void FilterFactions(List<string> result, string[] factions)
	{
		if (Utils.IsArrayNullOrEmpty(factions))
		{
			return;
		}
		string[] availableFractions = DB.Instance().dataInc.availableFractions;
		List<FractionConfig> list = DB.Instance().fractions.list;
		foreach (string faction in factions)
		{
			if (Array.FindIndex(availableFractions, (string elem) => elem == faction) >= 0)
			{
				result.Add(faction);
			}
			else if (list.FindIndex((FractionConfig elem) => elem.id == faction) >= 0)
			{
				Log.ConfigError("Faction '" + faction + "' is not in the active list.");
			}
			else
			{
				Log.ConfigError("Faction '" + faction + "' doesn't exist.");
			}
		}
	}

	public string GetRandomFaction(Random random)
	{
		string[] availableFractions = DB.Instance().dataInc.availableFractions;
		return availableFractions[random.Next(availableFractions.Length)];
	}

	public string[] AvailableFactions()
	{
		return DB.Instance().dataInc.availableFractions;
	}

	public ObjectConfig GetPortal(int index)
	{
		string[] portals = config.GetSettings().portals;
		string id = portals[index % portals.Length];
		return MapConfig.me.objects.Get(id);
	}

	public byte GetBiomeIdForFaction(string factionSid)
	{
		FractionConfig fractionConfig = DB.me.fractions.Get(factionSid);
		return GetTileConfigByBiomeSid(fractionConfig.biome)?.id ?? 1;
	}

	public int GetFactionIndex(string factionSid)
	{
		return DB.me.fractions.list.FindIndex((FractionConfig f) => f.id == factionSid);
	}

	public TileConfig GetTileConfigByBiomeSid(string biomeSid)
	{
		if (biomeIndexBySid.TryGetValue(biomeSid, out var value))
		{
			return MapConfig.me.tiles.list[value];
		}
		Log.ConfigError("Can't find tile config for biome '" + biomeSid + "'");
		return null;
	}

	public bool TryGetTileConfigByBiomeSid(string biomeSid, out TileConfig config)
	{
		if (biomeIndexBySid.TryGetValue(biomeSid, out var value))
		{
			config = MapConfig.me.tiles.list[value];
			return true;
		}
		config = null;
		return false;
	}

	public int? GetBiomeIdForSid(string biomeSid)
	{
		if (biomeIndexBySid.TryGetValue(biomeSid, out var value))
		{
			return MapConfig.me.tiles.list[value].id;
		}
		return null;
	}

	public byte GetBiomeIndexById(byte id)
	{
		return biomeIndexByID[id];
	}

	public static string GetBiomeSidForId(byte biomeID)
	{
		return MapConfig.me.tiles.Get(biomeID).biome;
	}

	public static EPropFraction GetMetaObjectFaction(byte biomeID)
	{
		string biome = MapConfig.me.tiles.Get(biomeID).biome;
		if (FractionUtility.TryGetPropFromFraction(DB.me.biomesInfo.GetFractionForBiome(biome), out var prop))
		{
			return prop;
		}
		return EPropFraction.Node;
	}

	public WaterConfig GetWaterConfigByName(string waterName)
	{
		return MapConfig.me.waters.list.Find((WaterConfig c) => c.name == waterName);
	}

	public byte GetWaterIdForBiomeId(int biomeID)
	{
		return waterIdByBiomeID[biomeID];
	}

	public int GetBiomesCount()
	{
		return MapConfig.me.tiles.list.Count;
	}

	public List<TileConfig> GetBiomes()
	{
		return MapConfig.me.tiles.list;
	}

	public bool TryGetResourceForMine(string mineSid, out MapObjectDesc desc)
	{
		string resourceForMine = config.GetResourceForMine(mineSid);
		if (resourceForMine != null)
		{
			ObjectConfig mapObjectConfig = GetMapObjectConfig(resourceForMine);
			ObjConfigBase logicConfig = GetLogicConfig(resourceForMine);
			desc = new MapObjectDesc(mapObjectConfig, logicConfig, -1, null);
			return true;
		}
		Log.ConfigError("Can't find resource for mine '" + mineSid + "'");
		desc = default(MapObjectDesc);
		return false;
	}

	public static List<SquadConfig> GetMatchingGuards(int value, bool isMainGuard)
	{
		Predicate<SquadConfig> predicate = (SquadConfig x) => value >= x.minSquadValue && value <= x.maxSquadValue;
		Predicate<SquadConfig> predicate2 = null;
		if (isMainGuard)
		{
			predicate2 = (SquadConfig x) => x.canBeMainGuard;
		}
		return SquadsSearchUtility.GetSquads(predicate, predicate2);
	}

	private static ObjectConfig GetMapObjectConfig(string sid)
	{
		return MapConfig.me.objects.Get(sid);
	}

	private static ObjConfigBase GetLogicConfig(string sid)
	{
		if (ObjectConfigs.me.TryGet(sid, out var _o))
		{
			return _o;
		}
		Log.ConfigError("\"" + sid + "\" doesn't have a logic config.");
		return null;
	}
}
